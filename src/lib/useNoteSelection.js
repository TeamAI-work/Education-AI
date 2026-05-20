import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect text selection inside elements,
 * calculate viewport coordinates for rendering a float-morphic capture button,
 * and handle selection clearances.
 */
export function useNoteSelection() {
  const [selectedText, setSelectedText] = useState('');
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSelection = useCallback((e) => {
    // If user clicked directly on or inside the tooltip button, do not clear selection
    if (e && e.target && e.target.closest('.note-tooltip-btn')) {
      return;
    }

    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();

    // If selection is valid and has actual contents
    if (text.length > 0 && !selection.isCollapsed) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Align tooltip centered just above the selection range
        setCoords({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 45 // 45px padding above selection
        });
        setSelectedText(text);
        setShowTooltip(true);
      } catch (err) {
        // Fallback for selection retrieval errors
      }
    } else {
      // Hide if selection was cleared or collapsed
      setShowTooltip(false);
    }
  }, []);

  // Explicit helper to clear active selection
  const clearSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
    } catch (err) {}
    setSelectedText('');
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    // Listen to mouseup to trigger coordinates and capture text selection
    document.addEventListener('mouseup', handleSelection);
    
    // Listen to selectionchange to handle keyboard-based selections
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [handleSelection]);

  return {
    selectedText,
    coords,
    showTooltip,
    clearSelection
  };
}
