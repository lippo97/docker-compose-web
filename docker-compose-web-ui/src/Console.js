import { Paper } from "@material-ui/core";
import { useEffect, useRef } from "react";

export default function Console({ lines = [] }) {
  const endRef = useRef();

  useEffect(() => {
    if (endRef.current !== undefined) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines]);

  const println = (line) => (
    <p style={{ margin: 0, marginBottom: 2 }}>{line}</p>
  );

  const Background = () => (
    <div
      style={{
        background: "#393939",
        color: "#ccc",
        fontFamily: "monospace",
        padding: 10,
        borderRadius: 5,
        maxHeight: 200,
        overflowY: "scroll",
      }}
    >
      {(lines.length ? lines : ["$"]).map(println)}
      <div ref={endRef}></div>
    </div>
  );

  return (
    <Paper style={{ padding: 10 }}>
      <Background />
    </Paper>
  );
}
