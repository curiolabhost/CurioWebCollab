import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "esb:showEditor";

export default function useEditorToggle() {
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v != null) setShowEditor(v === "true");
      } catch {}
    })();
  }, []);

  const toggle = async () => {
    try {
      const newValue = !showEditor;
      setShowEditor(newValue);
      await AsyncStorage.setItem(KEY, newValue ? "true" : "false");
    } catch {}
  };

  return { showEditor, toggle };
}
