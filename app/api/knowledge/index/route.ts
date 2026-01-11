import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex-client";

// Lazy-initialized Convex client
const getConvex = () => getConvexClient();
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";


// Chunk text into overlapping segments for better retrieval
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const charChunkSize = chunkSize * 4; // Approximate tokens
  const charOverlap = overlap * 4;

  if (text.length <= charChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + charChunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const searchStart = end - Math.floor(charChunkSize * 0.2);
      const searchRegion = text.slice(searchStart, end);

      for (const sep of [". ", "! ", "? ", "\n\n", "\n"]) {
        const lastSep = searchRegion.lastIndexOf(sep);
        if (lastSep !== -1) {
          end = searchStart + lastSep + sep.length;
          break;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    start = end - charOverlap;
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const { knowledgeBaseId, contentIds } = await request.json();

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "Missing knowledgeBaseId" },
        { status: 400 }
      );
    }

    const zepApiKey = process.env.ZEP_API_KEY;
    if (!zepApiKey) {
      return NextResponse.json(
        { error: "ZEP_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Collection name in Zep
    const collectionName = `kb_${knowledgeBaseId}`;

    // Get all content for this knowledge base
    const allContent = await getConvex().query(api.knowledgeBases.getContentForKnowledgeBase, {
      knowledgeBaseId: knowledgeBaseId as Id<"knowledgeBases">,
    });

    if (!allContent || allContent.length === 0) {
      return NextResponse.json(
        { error: "No content found for this knowledge base" },
        { status: 404 }
      );
    }

    // Filter to specific content IDs if provided
    const contentToIndex = contentIds
      ? allContent.filter((c: any) => contentIds.includes(c._id))
      : allContent;

    // Ensure collection exists
    try {
      const collResponse = await fetch(
        `https://api.getzep.com/api/v2/collections/${collectionName}`,
        {
          method: "GET",
          headers: {
            Authorization: `Api-Key ${zepApiKey}`,
          },
        }
      );

      if (collResponse.status === 404) {
        // Create collection
        await fetch("https://api.getzep.com/api/v2/collections", {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${zepApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: collectionName,
            description: `Knowledge base: ${knowledgeBaseId}`,
            embedding_dimensions: 1536,
          }),
        });
        console.log(`Created Zep collection: ${collectionName}`);
      }
    } catch (e) {
      console.error("Error checking/creating collection:", e);
    }

    // Process and index each piece of content
    let totalChunks = 0;
    let indexed = 0;

    for (const content of contentToIndex) {
      if (!content.content || content.status !== "completed") {
        continue;
      }

      // Chunk the content
      const chunks = chunkText(content.content);
      totalChunks += chunks.length;

      // Prepare documents for Zep
      const documents = chunks.map((chunk, i) => ({
        content: chunk,
        document_id: `${content._id}_chunk_${i}`,
        metadata: {
          source_type: content.sourceType,
          title: content.title,
          chunk_index: i,
          total_chunks: chunks.length,
          content_id: content._id,
          knowledge_base_id: knowledgeBaseId,
        },
      }));

      // Add to Zep
      const addResponse = await fetch(
        `https://api.getzep.com/api/v2/collections/${collectionName}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${zepApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(documents),
        }
      );

      if (addResponse.ok) {
        indexed += chunks.length;
        console.log(`Indexed ${chunks.length} chunks from ${content.title}`);
      } else {
        const error = await addResponse.text();
        console.error(`Failed to index ${content.title}: ${error}`);
      }
    }

    // Update knowledge base with vector store reference
    await getConvex().mutation(api.knowledgeBases.updateVectorStoreRef, {
      knowledgeBaseId: knowledgeBaseId as Id<"knowledgeBases">,
      vectorStoreRef: collectionName,
    });

    return NextResponse.json({
      success: true,
      collectionName,
      contentProcessed: contentToIndex.length,
      chunksIndexed: indexed,
      totalChunks,
    });
  } catch (error) {
    console.error("Indexing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Indexing failed" },
      { status: 500 }
    );
  }
}

// GET: Check indexing status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const knowledgeBaseId = searchParams.get("knowledgeBaseId");

  if (!knowledgeBaseId) {
    return NextResponse.json(
      { error: "Missing knowledgeBaseId" },
      { status: 400 }
    );
  }

  const zepApiKey = process.env.ZEP_API_KEY;
  if (!zepApiKey) {
    return NextResponse.json({
      indexed: false,
      error: "ZEP_API_KEY not configured",
    });
  }

  const collectionName = `kb_${knowledgeBaseId}`;

  try {
    const response = await fetch(
      `https://api.getzep.com/api/v2/collections/${collectionName}`,
      {
        headers: {
          Authorization: `Api-Key ${zepApiKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        indexed: true,
        collectionName,
        documentCount: data.document_count || 0,
      });
    } else {
      return NextResponse.json({
        indexed: false,
        collectionName,
      });
    }
  } catch (error) {
    return NextResponse.json({
      indexed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
