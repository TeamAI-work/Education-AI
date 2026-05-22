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

  const readSelection = useCallback(() => {
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

  /**
   * mouseup handler — e.target is always an Element here, so .closest() is safe.
   * If the user clicked inside the tooltip button we skip processing so the
   * tooltip does not disappear the moment they click "Add to Notebook".
   */
  const handleMouseUp = useCallback((e) => {
    // e.target is guaranteed to be an Element on mouseup events
    if (e.target instanceof Element && e.target.closest('.note-tooltip-btn')) {
      return;
    }
    readSelection();
  }, [readSelection]);

  /**
   * selectionchange handler — e.target is the Document node, NOT an Element.
   * Never call .closest() here; just read the current selection directly.
   */
  const handleSelectionChange = useCallback(() => {
    readSelection();
  }, [readSelection]);

  // Explicit helper to clear active selection
  const clearSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
    } catch (err) {}
    setSelectedText('');
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    // mouseup: captures selection coordinates after the user finishes dragging
    document.addEventListener('mouseup', handleMouseUp);
    // selectionchange: handles keyboard-driven selections (Shift+Arrow etc.)
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleMouseUp, handleSelectionChange]);

  return {
    selectedText,
    coords,
    showTooltip,
    clearSelection
  };
}
