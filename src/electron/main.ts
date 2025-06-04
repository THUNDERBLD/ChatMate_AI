import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import { isDev } from "./utils.js";

// type test = string;

app.on("ready", () => {
  const win = new BrowserWindow({
    width: 700,
    height: 500,
    alwaysOnTop: true,
  });

  // Create simple menu with always on top toggle
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Always on Top',
          type: 'checkbox' as const,
          click: () => {
            const isAlwaysOnTop = win.isAlwaysOnTop();
            win.setAlwaysOnTop(!isAlwaysOnTop);
          }
        }
      ]
    }
  ];


  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (isDev()) {
    win.loadURL("http://localhost:5123/");
  } else{
    win.loadFile(path.join(app.getAppPath()+"/dist-react/index.html"));
  }
});

