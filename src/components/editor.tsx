import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react"; // Fixed import to include useState

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
  const padding = (level - 1) * 30; // Adjust this value as needed
  return (
    <div className={` w-full flex flex-row ${isHidden ? "hidden" : ""}`}>
      <div className=" w-7 h-6 text-right text-xs text-text-color flex flex-end align-middle justify-end items-center">
        {id + 1}
      </div>
      <div
        id="line"
        className={`ml-3 min-h-[1.5rem] pl-2 relative flex flex-row ${
          isSelected ? "!bg-focus-color" : ""
        }`}
        onClick={onClick}
      >
        <div className="h-full pr-4" style={{ paddingLeft: `${padding}px` }}>
          {symbol}
        </div>
        <div
          className=" flex-wrap pr-1 wrap"
          style={{ wordBreak: "break-word" }}
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
  const [hiddenLevels, setHiddenLevels] = useState<{ [id: number]: boolean }>(
    {}
  );
  const editorRef = useRef();
  const [editable, setEditable] = useState(false);

  const handleLineClick = useCallback((id: number) => {
    setSelectedLine((prevId) => (prevId === id ? null : id)); // Toggle selection
    console.log("Line clicked:", id);
  }, []);

  useEffect(() => {
    const handleOrgFileContent = (event, data) => {
      setFileContent(data);
    };

    window.ipcRenderer.on("org-file-content", handleOrgFileContent);
  }, []);

  useEffect(() => {
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
        event.preventDefault();
        console.log("selectedLine", selectedLine);
        const index = selectedLine;
        const selectedLineObject = lines[index];
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
            }
          }
          for (let i = index + 1; i < lines.length; i++) {
            if (lines[i].props.level > selectedLevel) {
              newHiddenLevels[i] = hideLines;
            } else {
              break;
            }
          }
          return newHiddenLevels;
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    lines,
    fileContent,
    editable,
    hiddenLevels,
    editorRef,
    selectedLine,
    setHiddenLevels,
  ]);
  // Function to convert Org-mode content to HTML
  const orgModeToHTML = (fileContent, hiddenLevels) => {
    console.log("orgContent", fileContent);
    const lines = fileContent.split("\n");
    let lastHeadingLevel = 0;
    let prevLevel = 0;
    const htmlLines = lines.map((line, index) => {
      let links = [];
      line = line.replace(
        /\[\[((https?:\/\/|file:)?)(.*?)\]\[(.*?)\]\]/g,
        (_, protocol, __, url, linkText) => {
          const fullUrl = protocol ? `${protocol}${url}` : `https://${url}`;
          links.push(
            `<a ng-click href="${fullUrl}" target="_blank" class="underline text-highlight2-color">${linkText}</a>`
          );
          return `PLACEHOLDER_${links.length - 1}`;
        }
      );

      // Apply other formatting
      line = line.replace(
        /=(.*?)=/g,
        '<span class="text-highlight1-color">$1</span>'
      );
      line = line.replace(/\/(.*?)\//g, '<span class="italic">$1</span>');

      // Restore links from placeholders
      line = line.replace(/PLACEHOLDER_(\d+)/g, (_, index) => links[index]);

      // line = line.replace(
      //   /=(.*?)=/g,
      //   '<span class="text-highlight1-color">$1</span>'
      // );
      // line = line.replace(/\/(.*?)\//g, '<span class="italic">$1</span>');
      //line = line.replace(/\*(\S*?)\*/g, '<span class="font-bold">$1</span>')
      if (line.trim().startsWith("*")) {
        const level = (line.match(/^\*+/)[0] || [""]).length; // Count how many asterisks
        lastHeadingLevel = level;
        prevLevel = level;
        return (
          <div className=" font-bold">
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
          </div>
        );
      } else if (line.trim().startsWith("+")) {
        const spacing = (line.match(/(^ *)\+/) || [""])[0].length;
        const level = spacing / 2 + 0.5 + lastHeadingLevel;
        prevLevel = level;
        return (
          <Line
            key={index}
            id={index}
            level={level}
            symbol="•"
            content={line.slice(spacing).trim()}
            isSelected={selectedLine === index}
            onClick={() => handleLineClick(index)} // Remove the unused comma operator
            isHidden={hiddenLevels[index] || false}
          />
        ); // Convert to bullet point
      } else if (line.trim().startsWith("#+title:")) {
        line = line.slice(9).trim(); // Remove the '#+' from the line
        return (
          <div className="text-2xl text-highlight2-color">
            {" "}
            {/* Add a CSS class for bigger lines */}
            <Line
              key={index}
              id={index}
              level={0}
              symbol="|"
              content={line}
              isSelected={selectedLine === index}
              onClick={() => handleLineClick(index)}
              isHidden={hiddenLevels[index] || false}
            />
          </div>
        );
      } else {
        return (
          <Line
            key={index}
            id={index}
            level={prevLevel + 1}
            symbol=""
            content={line}
            isSelected={selectedLine === index}
            onClick={() => handleLineClick(index)}
            isHidden={hiddenLevels[index] || false}
          />
        );
      }
      return line; // Other lines as paragraphs
    });
    return htmlLines;
  };

  const processedLines = useMemo(
    () => orgModeToHTML(fileContent, hiddenLevels),
    [fileContent, hiddenLevels]
  );

  useEffect(() => {
    setLines(processedLines);
  }, [processedLines]);

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
