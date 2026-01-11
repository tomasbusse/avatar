"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Settings } from "lucide-react";

export type FieldType =
  | "text_input"
  | "multiple_choice"
  | "checkbox"
  | "matching"
  | "drag_drop"
  | "long_text";

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface FormFieldConfig {
  options?: MultipleChoiceOption[];
  matchingPairs?: MatchingPair[];
  minLength?: number;
  maxLength?: number;
}

export interface FormFieldData {
  id: string;
  pageIndex: number;
  type: FieldType;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string;
  placeholder?: string;
  required?: boolean;
  correctAnswers: string[];
  caseSensitive?: boolean;
  points?: number;
  config?: FormFieldConfig;
}

interface FormFieldProps {
  field: FormFieldData;
  isSelected: boolean;
  isEditing: boolean;
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  onDelete: () => void;
  onOpenSettings: () => void;
}

const FIELD_COLORS: Record<FieldType, string> = {
  text_input: "border-blue-400 bg-blue-50/80",
  multiple_choice: "border-green-400 bg-green-50/80",
  checkbox: "border-purple-400 bg-purple-50/80",
  matching: "border-orange-400 bg-orange-50/80",
  drag_drop: "border-pink-400 bg-pink-50/80",
  long_text: "border-teal-400 bg-teal-50/80",
};

const FIELD_LABELS: Record<FieldType, string> = {
  text_input: "Text",
  multiple_choice: "Choice",
  checkbox: "Check",
  matching: "Match",
  drag_drop: "Drag",
  long_text: "Long",
};

export function FormField({
  field,
  isSelected,
  isEditing,
  zoom,
  containerWidth,
  containerHeight,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onOpenSettings,
}: FormFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ width: 0, height: 0 });

  // Convert relative position (0-1) to pixels
  const pixelPosition = {
    x: field.position.x * containerWidth,
    y: field.position.y * containerHeight,
    width: field.position.width * containerWidth,
    height: field.position.height * containerHeight,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    onSelect();

    const rect = fieldRef.current!.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!fieldRef.current?.parentElement) return;

      const parentRect = fieldRef.current.parentElement.getBoundingClientRect();
      const newX = (e.clientX - parentRect.left - dragStartRef.current.x) / containerWidth;
      const newY = (e.clientY - parentRect.top - dragStartRef.current.y) / containerHeight;

      // Clamp to container bounds
      const clampedX = Math.max(0, Math.min(1 - field.position.width, newX));
      const clampedY = Math.max(0, Math.min(1 - field.position.height, newY));

      onMove({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();

    resizeStartRef.current = {
      width: pixelPosition.width,
      height: pixelPosition.height,
    };
    const startX = e.clientX;
    const startY = e.clientY;
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = Math.max(50, resizeStartRef.current.width + deltaX) / containerWidth;
      const newHeight = Math.max(30, resizeStartRef.current.height + deltaY) / containerHeight;

      // Clamp to container bounds
      const clampedWidth = Math.min(1 - field.position.x, newWidth);
      const clampedHeight = Math.min(1 - field.position.y, newHeight);

      onResize({ width: clampedWidth, height: clampedHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={fieldRef}
      className={cn(
        "absolute border-2 rounded transition-shadow",
        FIELD_COLORS[field.type],
        isSelected && "ring-2 ring-primary shadow-lg",
        isDragging && "cursor-grabbing opacity-80",
        isEditing && !isDragging && "cursor-grab hover:shadow-md"
      )}
      style={{
        left: pixelPosition.x,
        top: pixelPosition.y,
        width: pixelPosition.width,
        height: pixelPosition.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Field Type Badge */}
      <div className="absolute -top-5 left-0 text-xs font-medium px-1.5 py-0.5 rounded bg-white border shadow-sm">
        {FIELD_LABELS[field.type]}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </div>

      {/* Field Content Preview */}
      <div className="w-full h-full p-2 overflow-hidden">
        {field.type === "text_input" && (
          <div className="w-full h-full border-b-2 border-dashed border-gray-300 flex items-end">
            <span className="text-xs text-gray-400 truncate">
              {field.placeholder || "Text answer..."}
            </span>
          </div>
        )}
        {field.type === "multiple_choice" && (
          <div className="text-xs text-gray-500 space-y-1">
            {field.config?.options && field.config.options.length > 0 ? (
              field.config.options.slice(0, 4).map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full border-2 ${opt.isCorrect ? "border-green-500 bg-green-100" : "border-gray-400"}`} />
                  <span className={opt.isCorrect ? "text-green-600 font-medium" : ""}>{opt.text || `Option ${i + 1}`}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full border-2 border-gray-400" />
                  <span className="text-gray-400">Add options...</span>
                </div>
              </>
            )}
            {field.config?.options && field.config.options.length > 4 && (
              <span className="text-gray-400">+{field.config.options.length - 4} more</span>
            )}
          </div>
        )}
        {field.type === "checkbox" && (
          <div className="text-xs text-gray-500 space-y-1">
            {field.config?.options && field.config.options.length > 0 ? (
              field.config.options.slice(0, 4).map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-sm border-2 ${opt.isCorrect ? "border-green-500 bg-green-100" : "border-gray-400"}`} />
                  <span className={opt.isCorrect ? "text-green-600 font-medium" : ""}>{opt.text || `Item ${i + 1}`}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-gray-400 rounded-sm" />
                <span className="text-gray-400">Add options...</span>
              </div>
            )}
          </div>
        )}
        {field.type === "long_text" && (
          <div className="w-full h-full border border-dashed border-gray-300 rounded p-1">
            <span className="text-xs text-gray-400">
              {field.placeholder || "Long answer..."}
            </span>
          </div>
        )}
        {field.type === "matching" && (
          <div className="text-xs text-gray-500">Match pairs</div>
        )}
        {field.type === "drag_drop" && (
          <div className="text-xs text-gray-500">Drag & drop</div>
        )}
      </div>

      {/* Controls (visible when selected and editing) */}
      {isSelected && isEditing && (
        <>
          {/* Drag Handle */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 bg-white border rounded shadow-sm cursor-grab">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="absolute -right-8 top-0 flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="p-1 bg-white border rounded shadow-sm hover:bg-gray-100"
            >
              <Settings className="h-3 w-3 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 bg-white border rounded shadow-sm hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </button>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute -right-1 -bottom-1 w-4 h-4 bg-primary rounded-full cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}

      {/* Points indicator */}
      {field.points && field.points > 1 && (
        <div className="absolute -bottom-4 right-0 text-xs bg-gray-100 px-1 rounded">
          {field.points}pts
        </div>
      )}
    </div>
  );
}

// Student-facing form field (for preview/filling)
interface StudentFieldProps {
  field: FormFieldData;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  showResult?: boolean;
  isCorrect?: boolean;
}

export function StudentFormField({
  field,
  value,
  onChange,
  zoom,
  containerWidth,
  containerHeight,
  showResult,
  isCorrect,
}: StudentFieldProps) {
  const pixelPosition = {
    x: field.position.x * containerWidth,
    y: field.position.y * containerHeight,
    width: field.position.width * containerWidth,
    height: field.position.height * containerHeight,
  };

  return (
    <div
      className={cn(
        "absolute border-2 rounded bg-white/90",
        showResult && isCorrect && "border-green-500 bg-green-50/90",
        showResult && !isCorrect && "border-red-500 bg-red-50/90",
        !showResult && "border-gray-300 hover:border-blue-400 focus-within:border-blue-500"
      )}
      style={{
        left: pixelPosition.x,
        top: pixelPosition.y,
        width: pixelPosition.width,
        height: pixelPosition.height,
      }}
    >
      {field.type === "text_input" && (
        <input
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-full px-2 bg-transparent outline-none text-sm"
          disabled={showResult}
        />
      )}
      {field.type === "long_text" && (
        <textarea
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-full p-2 bg-transparent outline-none text-sm resize-none"
          disabled={showResult}
        />
      )}
      {field.type === "multiple_choice" && (
        <div className="w-full h-full p-2 overflow-auto">
          <div className="space-y-1">
            {(field.config as FormFieldConfig)?.options?.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm",
                  !showResult && "hover:bg-gray-100",
                  showResult && option.isCorrect && "bg-green-100",
                  showResult && value === option.id && !option.isCorrect && "bg-red-100"
                )}
              >
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={option.id}
                  checked={value === option.id}
                  onChange={() => onChange(option.id)}
                  disabled={showResult}
                  className="flex-shrink-0"
                />
                <span className={cn(
                  showResult && option.isCorrect && "text-green-700 font-medium"
                )}>
                  {option.text}
                </span>
              </label>
            )) || (
              <p className="text-xs text-gray-400">No options configured</p>
            )}
          </div>
        </div>
      )}
      {field.type === "checkbox" && (
        <div className="w-full h-full p-2 overflow-auto">
          <div className="space-y-1">
            {(field.config as FormFieldConfig)?.options?.map((option) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const isSelected = selectedValues.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm",
                    !showResult && "hover:bg-gray-100",
                    showResult && option.isCorrect && "bg-green-100",
                    showResult && isSelected && !option.isCorrect && "bg-red-100"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...selectedValues, option.id]);
                      } else {
                        onChange(selectedValues.filter((v) => v !== option.id));
                      }
                    }}
                    disabled={showResult}
                    className="flex-shrink-0"
                  />
                  <span className={cn(
                    showResult && option.isCorrect && "text-green-700 font-medium"
                  )}>
                    {option.text}
                  </span>
                </label>
              );
            }) || (
              <p className="text-xs text-gray-400">No options configured</p>
            )}
          </div>
        </div>
      )}
      {field.type === "matching" && (
        <div className="w-full h-full p-2 flex items-center justify-center">
          <p className="text-xs text-gray-400">Matching (coming soon)</p>
        </div>
      )}
      {field.type === "drag_drop" && (
        <div className="w-full h-full p-2 flex items-center justify-center">
          <p className="text-xs text-gray-400">Drag & Drop (coming soon)</p>
        </div>
      )}
    </div>
  );
}
