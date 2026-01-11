"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  WorksheetContent,
  WorksheetSection,
  DEFAULT_WORKSHEET_DESIGN,
} from "@/lib/types/worksheet-content";
import type { VocabularyItem, GrammarRule } from "@/lib/types/lesson-content";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Edit2,
  Type,
  FileText,
  BookOpen,
  MessageSquare,
  Columns,
  Minus,
  BookA,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorksheetEditorProps {
  content: WorksheetContent;
  onChange: (content: WorksheetContent) => void;
  editable?: boolean;
  className?: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  instructions: <FileText className="h-4 w-4" />,
  content: <Type className="h-4 w-4" />,
  exercise: <Edit2 className="h-4 w-4" />,
  vocabulary: <BookA className="h-4 w-4" />,
  grammar: <BookOpen className="h-4 w-4" />,
  reading: <MessageSquare className="h-4 w-4" />,
  writing: <MessageSquare className="h-4 w-4" />,
  divider: <Minus className="h-4 w-4" />,
  spacer: <Columns className="h-4 w-4" />,
};

export function WorksheetEditor({
  content,
  onChange,
  editable = true,
  className,
}: WorksheetEditorProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const design = content.design || DEFAULT_WORKSHEET_DESIGN;
  const colors = design.colors;

  // Update a specific section
  const updateSection = useCallback(
    (sectionId: string, updates: Partial<WorksheetSection>) => {
      const newSections = content.content.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      );
      onChange({
        ...content,
        content: { ...content.content, sections: newSections },
        metadata: { ...content.metadata, updatedAt: Date.now() },
      });
    },
    [content, onChange]
  );

  // Delete a section
  const deleteSection = useCallback(
    (sectionId: string) => {
      const newSections = content.content.sections.filter(
        (s) => s.id !== sectionId
      );
      onChange({
        ...content,
        content: { ...content.content, sections: newSections },
        metadata: { ...content.metadata, updatedAt: Date.now() },
      });
      setSelectedSectionId(null);
    },
    [content, onChange]
  );

  // Add a new section
  const addSection = useCallback(
    (type: WorksheetSection["type"], afterIndex?: number) => {
      const newId = `sec-${Date.now()}`;
      const newSection: WorksheetSection = {
        id: newId,
        type,
        title: type === "divider" || type === "spacer" ? undefined : `New ${type} section`,
      };

      // Add type-specific content
      if (type === "exercise") {
        newSection.exercise = {
          type: "fill_blank",
          instructions: "Complete the following sentences:",
          points: 10,
          items: [],
          showNumbering: true,
          showAnswerLines: true,
        };
      } else if (type === "vocabulary") {
        newSection.vocabulary = [];
      } else if (type === "grammar") {
        newSection.grammarRule = {
          id: `gram-${Date.now()}`,
          name: "Grammar Rule",
          category: "other",
          rule: "Add your grammar rule explanation here.",
          examples: [],
          commonMistakes: [],
        };
      } else if (type === "content" || type === "instructions") {
        newSection.content = "Add your content here...";
      }

      const insertIndex =
        afterIndex !== undefined
          ? afterIndex + 1
          : content.content.sections.length;
      const newSections = [...content.content.sections];
      newSections.splice(insertIndex, 0, newSection);

      onChange({
        ...content,
        content: { ...content.content, sections: newSections },
        metadata: { ...content.metadata, updatedAt: Date.now() },
      });
      setSelectedSectionId(newId);
    },
    [content, onChange]
  );

  // Move section up/down
  const moveSection = useCallback(
    (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= content.content.sections.length) return;

      const newSections = [...content.content.sections];
      [newSections[index], newSections[newIndex]] = [
        newSections[newIndex],
        newSections[index],
      ];

      onChange({
        ...content,
        content: { ...content.content, sections: newSections },
        metadata: { ...content.metadata, updatedAt: Date.now() },
      });
    },
    [content, onChange]
  );

  // Handle drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...content.content.sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);

    onChange({
      ...content,
      content: { ...content.content, sections: newSections },
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onChange({
      ...content,
      metadata: { ...content.metadata, updatedAt: Date.now() },
    });
  };

  // Update header fields
  const updateHeader = useCallback(
    (updates: Partial<NonNullable<typeof content.content.header>>) => {
      onChange({
        ...content,
        content: {
          ...content.content,
          header: content.content.header
            ? { ...content.content.header, ...updates }
            : undefined,
        },
        metadata: { ...content.metadata, updatedAt: Date.now() },
      });
    },
    [content, onChange]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "worksheet-editor bg-white rounded-lg shadow-lg overflow-hidden",
        className
      )}
      style={{
        fontFamily: `'${design.fonts.body}', sans-serif`,
        fontSize: `${design.fonts.bodySize}px`,
      }}
    >
      {/* Worksheet Header */}
      {content.content.header && (
        <div
          className="p-6 border-b-4"
          style={{ borderColor: colors.primary }}
        >
          {/* Title Row */}
          <div className="flex items-baseline justify-between mb-4">
            {content.content.header.showTitle && (
              <h1
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onChange({
                    ...content,
                    metadata: {
                      ...content.metadata,
                      title: e.currentTarget.textContent || "",
                      updatedAt: Date.now(),
                    },
                  })
                }
                className={cn(
                  "text-2xl font-bold outline-none",
                  editable && "hover:bg-gray-50 focus:bg-blue-50 rounded px-1"
                )}
                style={{
                  fontFamily: `'${design.fonts.heading}', serif`,
                  color: colors.primary,
                }}
              >
                {content.metadata.title}
              </h1>
            )}
            {content.content.header.showLevel && (
              <span
                className="text-sm font-semibold px-3 py-1 rounded"
                style={{ backgroundColor: colors.action, color: "white" }}
              >
                {content.metadata.level}
              </span>
            )}
          </div>

          {/* Instructions */}
          {content.content.header.showInstructions &&
            content.content.header.instructions && (
              <p
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateHeader({ instructions: e.currentTarget.textContent || "" })
                }
                className={cn(
                  "text-sm mb-4 outline-none",
                  editable && "hover:bg-gray-50 focus:bg-blue-50 rounded px-1"
                )}
                style={{ color: colors.secondary }}
              >
                {content.content.header.instructions}
              </p>
            )}

          {/* Student Fields */}
          <div className="flex flex-wrap gap-6 pt-4 border-t" style={{ borderColor: colors.background }}>
            {content.content.header.studentNameField && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: colors.secondary }}>
                  Name:
                </span>
                <span className="border-b-2 inline-block min-w-[150px]" style={{ borderColor: colors.text }} />
              </div>
            )}
            {content.content.header.dateField && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: colors.secondary }}>
                  Date:
                </span>
                <span className="border-b-2 inline-block min-w-[100px]" style={{ borderColor: colors.text }} />
              </div>
            )}
            {content.content.header.scoreField && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: colors.secondary }}>
                  Score:
                </span>
                <span className="border-b-2 inline-block min-w-[60px]" style={{ borderColor: colors.text }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="p-6 space-y-6">
        {content.content.sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={index}
            isSelected={selectedSectionId === section.id}
            editable={editable}
            design={design}
            onSelect={() => setSelectedSectionId(section.id)}
            onUpdate={(updates) => updateSection(section.id, updates)}
            onDelete={() => deleteSection(section.id)}
            onMoveUp={() => moveSection(index, "up")}
            onMoveDown={() => moveSection(index, "down")}
            onAddAfter={(type) => addSection(type, index)}
            canMoveUp={index > 0}
            canMoveDown={index < content.content.sections.length - 1}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            isDragging={draggedIndex === index}
          />
        ))}

        {/* Add Section Button */}
        {editable && (
          <div className="flex justify-center pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => addSection("content")}>
                  {SECTION_ICONS.content} Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("instructions")}>
                  {SECTION_ICONS.instructions} Instructions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("exercise")}>
                  {SECTION_ICONS.exercise} Exercise
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("vocabulary")}>
                  {SECTION_ICONS.vocabulary} Vocabulary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("grammar")}>
                  {SECTION_ICONS.grammar} Grammar Rule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("divider")}>
                  {SECTION_ICONS.divider} Divider
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSection("spacer")}>
                  {SECTION_ICONS.spacer} Spacer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Footer */}
      {content.content.footer && (
        <div
          className="px-6 py-4 border-t-2 flex justify-between items-center"
          style={{ borderColor: colors.background, color: colors.textMuted }}
        >
          {content.content.footer.showTotalScore && (
            <span className="text-sm">
              Total Points:{" "}
              <strong>
                {content.content.footer.totalPoints ||
                  content.content.sections
                    .filter((s) => s.exercise)
                    .reduce((sum, s) => sum + (s.exercise?.points || 0), 0)}
              </strong>
            </span>
          )}
          {content.content.footer.customText && (
            <span
              contentEditable={editable}
              suppressContentEditableWarning
              className={cn(
                "text-sm outline-none",
                editable && "hover:bg-gray-50 focus:bg-blue-50 rounded px-1"
              )}
            >
              {content.content.footer.customText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Individual Section Editor
interface SectionEditorProps {
  section: WorksheetSection;
  index: number;
  isSelected: boolean;
  editable: boolean;
  design: NonNullable<WorksheetContent["design"]>;
  onSelect: () => void;
  onUpdate: (updates: Partial<WorksheetSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: (type: WorksheetSection["type"]) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function SectionEditor({
  section,
  index,
  isSelected,
  editable,
  design,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: SectionEditorProps) {
  const colors = design.colors;

  // Render different section types
  const renderSectionContent = () => {
    switch (section.type) {
      case "instructions":
        return (
          <div
            className="p-4 rounded-r-lg"
            style={{
              backgroundColor: colors.background,
              borderLeft: `4px solid ${colors.accent}`,
            }}
          >
            <div
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) =>
                onUpdate({ content: e.currentTarget.innerHTML })
              }
              className={cn(
                "outline-none prose prose-sm max-w-none",
                editable && "hover:bg-white/50 focus:bg-white/80 rounded p-1"
              )}
              dangerouslySetInnerHTML={{ __html: section.content || "" }}
            />
          </div>
        );

      case "content":
        return (
          <div
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ content: e.currentTarget.innerHTML })}
            className={cn(
              "outline-none prose prose-sm max-w-none",
              editable && "hover:bg-gray-50 focus:bg-blue-50 rounded p-2"
            )}
            dangerouslySetInnerHTML={{ __html: section.content || "" }}
          />
        );

      case "exercise":
        return section.exercise ? (
          <ExerciseEditor
            exercise={section.exercise}
            editable={editable}
            design={design}
            onUpdate={(updates) =>
              onUpdate({ exercise: { ...section.exercise!, ...updates } })
            }
          />
        ) : null;

      case "vocabulary":
        return section.vocabulary ? (
          <VocabularyEditor
            vocabulary={section.vocabulary}
            editable={editable}
            design={design}
            onUpdate={(vocab) => onUpdate({ vocabulary: vocab })}
          />
        ) : null;

      case "grammar":
        return section.grammarRule ? (
          <GrammarEditor
            rule={section.grammarRule}
            editable={editable}
            design={design}
            onUpdate={(updates) =>
              onUpdate({ grammarRule: { ...section.grammarRule!, ...updates } })
            }
          />
        ) : null;

      case "divider":
        return (
          <hr
            className="my-4"
            style={{ borderTop: `2px solid ${colors.background}` }}
          />
        );

      case "spacer":
        return <div style={{ height: "2em" }} />;

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "section-wrapper relative group rounded-lg transition-all",
        isSelected && editable && "ring-2 ring-blue-400 ring-offset-2",
        isDragging && "opacity-50",
        editable && "cursor-pointer"
      )}
      onClick={onSelect}
      draggable={editable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Section Controls (visible on hover/selection in edit mode) */}
      {editable && (
        <div
          className={cn(
            "absolute -left-10 top-0 flex flex-col gap-1 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            className="p-1 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <div className="p-1 bg-white border rounded shadow-sm cursor-grab">
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            className="p-1 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Delete Button */}
      {editable && isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-10 top-0 p-1 bg-white border rounded shadow-sm hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      )}

      {/* Section Title */}
      {section.title && section.type !== "divider" && section.type !== "spacer" && (
        <h2
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ title: e.currentTarget.textContent || "" })}
          className={cn(
            "text-lg font-bold mb-3 pb-2 border-b-2 outline-none",
            editable && "hover:bg-gray-50 focus:bg-blue-50 rounded px-1"
          )}
          style={{
            fontFamily: `'${design.fonts.heading}', serif`,
            color: colors.primary,
            borderColor: colors.background,
          }}
        >
          {section.title}
        </h2>
      )}

      {/* Section Content */}
      {renderSectionContent()}

      {/* Add After Button (visible on hover) */}
      {editable && (
        <div
          className={cn(
            "absolute -bottom-4 left-1/2 -translate-x-1/2 transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600">
                <Plus className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAddAfter("content")}>
                Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddAfter("exercise")}>
                Exercise
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddAfter("vocabulary")}>
                Vocabulary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddAfter("grammar")}>
                Grammar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddAfter("divider")}>
                Divider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// Exercise Editor Component
interface ExerciseEditorProps {
  exercise: NonNullable<WorksheetSection["exercise"]>;
  editable: boolean;
  design: NonNullable<WorksheetContent["design"]>;
  onUpdate: (updates: Partial<NonNullable<WorksheetSection["exercise"]>>) => void;
}

function ExerciseEditor({
  exercise,
  editable,
  design,
  onUpdate,
}: ExerciseEditorProps) {
  const colors = design.colors;

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      question: "Type your sentence here with ___ for blanks",
      correctAnswer: "",
    };
    onUpdate({ items: [...exercise.items, newItem] });
  };

  const updateItem = (
    itemId: string,
    updates: Partial<(typeof exercise.items)[0]>
  ) => {
    onUpdate({
      items: exercise.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const deleteItem = (itemId: string) => {
    onUpdate({
      items: exercise.items.filter((item) => item.id !== itemId),
    });
  };

  // Insert blank at current position or end
  const insertBlank = (itemId: string, question: string) => {
    const newQuestion = question + " ___ ";
    updateItem(itemId, { question: newQuestion });
  };

  return (
    <div className="exercise-editor border rounded-lg p-4" style={{ borderColor: colors.background }}>
      {/* Instructions */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1">Instructions</label>
        <input
          type="text"
          value={exercise.instructions || ""}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          disabled={!editable}
          className={cn(
            "w-full px-3 py-2 border rounded text-sm",
            editable ? "bg-white" : "bg-gray-50"
          )}
          placeholder="e.g., Complete the sentences with the correct words"
          style={{ color: colors.secondary }}
        />
      </div>

      {/* Exercise Items */}
      <div className="space-y-4">
        {exercise.items.map((item, i) => (
          <div
            key={item.id}
            className="exercise-item p-3 border rounded-lg bg-white group"
            style={{ borderColor: colors.background }}
          >
            <div className="flex items-start gap-3">
              {exercise.showNumbering && (
                <span className="font-bold text-lg min-w-[24px]" style={{ color: colors.primary }}>
                  {i + 1}.
                </span>
              )}
              <div className="flex-1 space-y-2">
                {/* Question with inline blanks */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Question (use ___ for blanks)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateItem(item.id, { question: e.target.value })}
                      disabled={!editable}
                      className="flex-1 px-3 py-2 border rounded text-sm"
                      placeholder="Type sentence with ___ for blanks"
                    />
                    {editable && (
                      <button
                        onClick={() => insertBlank(item.id, item.question)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Insert blank"
                      >
                        + Blank
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview with styled blanks */}
                <div className="p-2 bg-gray-50 rounded text-sm">
                  <span className="text-xs text-gray-400 block mb-1">Preview:</span>
                  {item.question.split(/(_+|\[blank\]|\[___\])/).map((part, j) =>
                    /_+|\[blank\]|\[___\]/.test(part) ? (
                      <span
                        key={j}
                        className="inline-block border-b-2 min-w-[80px] mx-1 text-center"
                        style={{
                          borderColor: colors.action,
                          width: exercise.answerLineLength ? `${exercise.answerLineLength}px` : undefined,
                        }}
                      >
                        <span className="text-xs text-gray-400">(blank)</span>
                      </span>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </div>

                {/* Correct Answer */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-green-600 font-medium whitespace-nowrap">
                    Correct Answer:
                  </label>
                  <input
                    type="text"
                    value={item.correctAnswer}
                    onChange={(e) => updateItem(item.id, { correctAnswer: e.target.value })}
                    disabled={!editable}
                    className="flex-1 px-2 py-1 text-sm border rounded bg-green-50 text-green-700 border-green-200"
                    placeholder="Enter the correct answer"
                  />
                </div>

                {/* Multiple Choice Options */}
                {exercise.type === "multiple_choice" && item.options && (
                  <div className="mt-2 ml-4 space-y-1">
                    {item.options.map((option, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span>{String.fromCharCode(97 + oi)})</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editable && (
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      {editable && (
        <button
          onClick={addItem}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add item
        </button>
      )}

      {/* Points */}
      <div className="mt-4 text-right text-sm" style={{ color: colors.textMuted }}>
        {editable ? (
          <span className="flex items-center justify-end gap-1">
            Points:
            <input
              type="number"
              value={exercise.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
              className="w-12 text-center border rounded px-1"
            />
          </span>
        ) : (
          <span>({exercise.points} points)</span>
        )}
      </div>
    </div>
  );
}

// Vocabulary Editor Component
interface VocabularyEditorProps {
  vocabulary: VocabularyItem[];
  editable: boolean;
  design: NonNullable<WorksheetContent["design"]>;
  onUpdate: (vocabulary: VocabularyItem[]) => void;
}

function VocabularyEditor({
  vocabulary,
  editable,
  design,
  onUpdate,
}: VocabularyEditorProps) {
  const colors = design.colors;

  const addVocab = () => {
    const newVocab: VocabularyItem = {
      id: `vocab-${Date.now()}`,
      term: "new word",
      termDe: "neues Wort",
      partOfSpeech: "noun",
      definition: "Definition here",
      definitionDe: "Definition hier",
      exampleSentence: "Example sentence.",
      exampleSentenceDe: "Beispielsatz.",
      level: "B1",
    };
    onUpdate([...vocabulary, newVocab]);
  };

  const updateVocab = (id: string, updates: Partial<VocabularyItem>) => {
    onUpdate(
      vocabulary.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const deleteVocab = (id: string) => {
    onUpdate(vocabulary.filter((v) => v.id !== id));
  };

  return (
    <div className="vocabulary-editor">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: colors.primary }}>
            <th className="text-white text-left p-2 font-semibold">English</th>
            <th className="text-white text-left p-2 font-semibold">German</th>
            <th className="text-white text-left p-2 font-semibold">Example</th>
            {editable && <th className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {vocabulary.map((vocab, i) => (
            <tr
              key={vocab.id}
              className="group"
              style={{
                backgroundColor: i % 2 === 1 ? colors.backgroundAlt : "white",
              }}
            >
              <td className="p-2">
                <strong
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    updateVocab(vocab.id, {
                      term: e.currentTarget.textContent || "",
                    })
                  }
                  className={cn(
                    "outline-none",
                    editable && "hover:bg-white focus:bg-blue-50 rounded px-1"
                  )}
                >
                  {vocab.term}
                </strong>
              </td>
              <td
                className={cn(
                  "p-2 outline-none",
                  editable && "hover:bg-white focus:bg-blue-50"
                )}
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateVocab(vocab.id, {
                    termDe: e.currentTarget.textContent || "",
                  })
                }
              >
                {vocab.termDe}
              </td>
              <td
                className={cn(
                  "p-2 outline-none text-sm",
                  editable && "hover:bg-white focus:bg-blue-50"
                )}
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateVocab(vocab.id, {
                    exampleSentence: e.currentTarget.textContent || "",
                  })
                }
              >
                {vocab.exampleSentence}
              </td>
              {editable && (
                <td className="p-2">
                  <button
                    onClick={() => deleteVocab(vocab.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editable && (
        <button
          onClick={addVocab}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add vocabulary
        </button>
      )}
    </div>
  );
}

// Grammar Rule Editor Component
interface GrammarEditorProps {
  rule: GrammarRule;
  editable: boolean;
  design: NonNullable<WorksheetContent["design"]>;
  onUpdate: (updates: Partial<GrammarRule>) => void;
}

function GrammarEditor({
  rule,
  editable,
  design,
  onUpdate,
}: GrammarEditorProps) {
  const colors = design.colors;

  return (
    <div
      className="grammar-box p-4 rounded-r-lg"
      style={{
        backgroundColor: colors.backgroundAlt,
        borderLeft: `4px solid ${colors.action}`,
      }}
    >
      <h3
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onUpdate({ name: e.currentTarget.textContent || "" })}
        className={cn(
          "font-bold mb-3 outline-none",
          editable && "hover:bg-white focus:bg-blue-50 rounded px-1"
        )}
        style={{ color: colors.action }}
      >
        {rule.name}
      </h3>

      <div
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onUpdate({ rule: e.currentTarget.innerHTML })}
        className={cn(
          "prose prose-sm max-w-none mb-3 outline-none",
          editable && "hover:bg-white focus:bg-blue-50 rounded p-1"
        )}
        dangerouslySetInnerHTML={{ __html: rule.rule }}
      />

      {rule.formula && (
        <div
          className="bg-white p-3 rounded font-mono text-sm font-semibold my-3"
          style={{ color: colors.primary }}
        >
          {editable ? (
            <input
              type="text"
              value={rule.formula}
              onChange={(e) => onUpdate({ formula: e.target.value })}
              className="w-full bg-transparent outline-none"
              placeholder="Grammar formula (e.g., Subject + have/has + past participle)"
            />
          ) : (
            rule.formula
          )}
        </div>
      )}

      {rule.examples && rule.examples.length > 0 && (
        <div className="mt-3">
          <p className="font-semibold mb-2">Examples:</p>
          <ul className="space-y-1">
            {rule.examples.map((ex, i) => (
              <li key={i}>
                <span className="text-green-600">✓ {ex.correct}</span>
                {ex.incorrect && (
                  <span className="text-red-500 ml-2">
                    (Not: ✗ <s>{ex.incorrect}</s>)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default WorksheetEditor;
