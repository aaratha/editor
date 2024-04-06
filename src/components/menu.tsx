import { IoSettingsSharp } from "react-icons/io5";
import { IoFileTrayStacked } from "react-icons/io5";
import { MdOutlineKeyboardDoubleArrowLeft } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import React, { useEffect, useState } from "react";

type MenuItemProps = {
  title: string;
  date: string;
  path: string;
  onClick: (path: string) => void;
  index: number;
};



export const Menu = (): JSX.Element => {
  const [orgFiles, setOrgFiles] = useState<string[]>([]);
  const [viewState, toggleViewState] = useState<boolean>(true)

  useEffect(() => {
    window.ipcRenderer.on("selected-directory", (event, path) => {
      window.ipcRenderer.send("get-org-files", path);
    });

    window.ipcRenderer.on("org-files", (event, files) => {
      setOrgFiles(files);
      console.log(files);
    });
  }, []);

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const handleSettingsClick = () => {
    const settings = document.querySelector(".settings");
    if (settings) {
      settings.classList.toggle("hidden");
      settings.classList.add("flex");
    }
  };

  const handleMenuItemClick = (path: string) => {
    console.log("Opening file:", path);
    window.ipcRenderer.send("open-file", path);
    window.ipcRenderer.send('get-org-file-content', path);
  };

  const handleToggleClick = () => {
    console.log("toggling menu view")
    toggleViewState(!viewState)
  }

  const MenuItem: React.FC<MenuItemProps> = ({ title, date, path, onClick, index }) => {
    return (
      <div className="menu-item">
        <button className={`menu-button group overflow-hidden ${viewState === true ? 'w-full' : 'w-[2em] !pl-[0.72em]'}`} onClick={() => onClick(path)}>
          <div className="flex w-8 pr-3 align-middle items-center justify-center h-full text-text-color opacity-50 group-hover:text-focused-text-color transition-all text-md ">{index}</div>
          <div className={`flex flex-col w-full h-full transition-all `}>
            <h1>{title}</h1>
            <p>{date}</p>
          </div>
          <button
            id="delete"
            className="opacity-0 group-hover:opacity-100 flex w-8 align-middle items-center justify-center h-full text-text-color hover:text-red transition-all text-xl"
          >
            <MdDeleteOutline />
          </button>
        </button>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full transition-all ${viewState === true ? "w-[15em] pl-[6px]" : "w-[3.05rem] pl-[6px] pb-[0px]"}  ${
        isMac ? "pt-[2rem]" : "pt-[0rem]"
      }`}
    >
      <div className="flex flex-row flex-wrap-reverse w-full pl-1 pr-1 justify-between mb-1">
        <button
          onClick={() => window.ipcRenderer.send("open-directory-dialog")}
          className="tray-item"
        >
          <IoFileTrayStacked />
        </button>
        <button className="tray-item">
          <FaSave />
        </button>
        <button className="tray-item" onClick={handleSettingsClick}>
          <IoSettingsSharp />
        </button>
        <button className="tray-item " onClick={handleToggleClick}>
          <MdOutlineKeyboardDoubleArrowLeft />
        </button>
      </div>
      {orgFiles.map((file, index) => (
        <MenuItem
          key={index}
          title={file.title}
          date={new Date().toLocaleDateString()}
          path={file.path}
          onClick={() => handleMenuItemClick(file.path)}
          index={index+1}
        />
      ))}
    </div>
  );
};
