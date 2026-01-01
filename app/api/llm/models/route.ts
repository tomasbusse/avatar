import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://beethoven.app",
                "X-Title": "Beethoven AI Teacher",
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch OpenRouter models:", error);
        return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
    }
}
