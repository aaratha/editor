import React, { useEffect, useState, useRef, useCallback } from "react"; // Fixed import to include useState

interface LineProps {
  id: number;
  level: number;
  symbol: string;
  content: string;
  isSelected: boolean;
  onClick: () => void;
  isHidden?: boolean;
}

const LineComponent: React.FC<LineProps> = ({
  id,
  level,
  symbol,
  content,
  isSelected,
  onClick,
  isHidden = false,
}) => {
  console.log("Line re-rendered:", id);
  console.log("isSelected:", isSelected);
  const padding = (level - 1) * 20; // Adjust this value as needed
  return (
    <div className={` w-full flex flex-row ${isHidden ? "hidden" : ""}`}>
      <div className=" w-7 h-6 text-right text-xs text-text-color flex flex-end align-middle justify-end items-center">
        {id + 1}
      </div>
      <div
        id="line"
        className={`ml-3 pl-2 relative flex flex-row ${
          isSelected ? "!bg-focus-color" : ""
        }`}
        onClick={onClick}
      >
        <div className="h-full pr-4" style={{ paddingLeft: `${padding}px` }}>
          {symbol}
        </div>
        <div
          className=" flex-wrap pr-1"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

const Line = React.memo(LineComponent);

export const Editor = () => {
  const [fileContent, setFileContent] = useState("");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lines, setLines] = useState<LineProps[]>([]); // State to store line objects including visibility
  const [triggerRerender, setTriggerRerender] = useState(false);
  const [hiddenLevels, setHiddenLevels] = useState<{ [id: number]: boolean }>(
    {}
  );
  const editorRef = useRef();
  const [editable, setEditable] = useState(false);

  const handleLineClick = useCallback((id: number) => {
    setSelectedLine((prevId) => (prevId === id ? null : id)); // Toggle selection
    console.log("Line clicked:", id);
    setTriggerRerender(!triggerRerender);
  });

  useEffect(() => {
    window.ipcRenderer.receiveOrgFileContent((event, content) => {
      setFileContent(content); // Update the state variable with the new content
      if (editorRef.current) {
        (editorRef.current as HTMLElement).innerHTML = orgModeToHTML(content); // Convert Org content to HTML and set as innerHTML
        console.log("fileContent", fileContent); // Log the updated content
      }
    });

    const handleKeyDown = (event) => {
      if (!editable && event.key === "i") {
        setEditable(true);
      }

      if ((editable && event.key === "Escape") || event.keyCode === 27) {
        setEditable(false);
      }
      if (
        (selectedLine !== null && event.key === "Tab") ||
        (event.keyCode === 9 && !editable)
      ) {
        console.log("selectedLine", selectedLine);
        console.log("Tab pressed");
        event.preventDefault();
        console.log("Lines:", lines);
        const index = selectedLine;
        const selectedLineObject = lines[index];
        console.log("Selected line object:", selectedLineObject);
        const selectedLevel = selectedLineObject.props.level;
        console.log("Selected level:", selectedLevel);
        setHiddenLevels((prevHiddenLevels) => {
          const newHiddenLevels = { ...prevHiddenLevels };
          // Determine if we are hiding or showing lines based on the current state of the clicked line
          let hideLines = false;
          for (let i = index + 1; i < lines.length; i++) {
            if (lines[i].props.level > selectedLevel) {
              if (!newHiddenLevels[i]) {
                hideLines = true;
                break;
              }
            } else {
              break;
            }
          }
          setTriggerRerender((r) => !r);
          // Iterate over lines starting from the line after the clicked one
          for (let i = index + 1; i < lines.length; i++) {
            if (lines[i].props.level > selectedLevel) {
              // If the line is a child (has a greater level), toggle its visibility
              newHiddenLevels[i] = hideLines;
            } else {
              // Once we reach a line that is not a child, stop the loop
              break;
            }
          }

          console.log("Updated hiddenLevels:", newHiddenLevels);
          return newHiddenLevels;
        });
      }
    };

    document.addEventListener("keyup", handleKeyDown);

    return () => {
      document.removeEventListener("keyup", handleKeyDown);
    };
  }, [
    lines,
    fileContent,
    editable,
    hiddenLevels,
    editorRef,
    selectedLine,
    setHiddenLevels,
    setTriggerRerender,
    triggerRerender,
  ]);
  // Function to convert Org-mode content to HTML
  const orgModeToHTML = (fileContent) => {
    console.log("orgContent", fileContent);
    const lines = fileContent.split("\n");
    const htmlLines = lines.map((line, index) => {
      line = line.replace(
        /=(.*?)=/g,
        '<span class="text-highlighted-text-color">$1</span>'
      );
      line = line.replace(/\/(.*?)\//g, '<span class="italic">$1</span>');
      //line = line.replace(/\*(\S*?)\*/g, '<span class="font-bold">$1</span>')
      if (line.trim().startsWith("*")) {
        const level = line.match(/^\*+/)[0].length; // Count how many asterisks
        return (
          <Line
            key={index}
            id={index}
            level={level}
            symbol=""
            content={line.slice(level).trim()}
            isSelected={selectedLine === index}
            onClick={() => handleLineClick(index)}
            isHidden={hiddenLevels[index] || false}
          />
        );
      } else if (line.trim().startsWith("+")) {
        const level = (line.match(/(^ *)\+/) || [""])[0].length;
        return (
          <Line
            key={index}
            id={index}
            level={level}
            symbol="•"
            content={line.slice(level).trim()}
            isSelected={selectedLine === index}
            onClick={() => handleLineClick(index)} // Remove the unused comma operator
            isHidden={hiddenLevels[index] || false}
          />
        ); // Convert to bullet point
      }
      return line; // Other lines as paragraphs
    });
    return htmlLines;
  };

  useEffect(() => {
    setLines(orgModeToHTML(fileContent));
  }, [fileContent, selectedLine, triggerRerender]);

  return (
    <div className="editor-container pr-1 text-editor-text-color h-full w-full flex flex-col rounded-md bg-editor-color">
      <div
        contentEditable={editable}
        className="editor-content scrollbar outline-none overflow-x-hidden w-full mr-4 pt-4 pr-4"
      >
        <>{lines}</>
      </div>
    </div>
  );
};
