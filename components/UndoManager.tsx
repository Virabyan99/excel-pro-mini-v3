"use client";
import { useHotkeys } from "react-hotkeys-hook";
import { useStoreActions } from "./StoreProvider";

export function UndoManager() {
  const { undo, redo } = useStoreActions();

  useHotkeys("ctrl+z, cmd+z", undo, [], { enableOnFormTags: true });
  useHotkeys("ctrl+y, cmd+shift+z", redo, [], { enableOnFormTags: true });

  return null;
}