#![cfg_attr(all(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowEvent,
};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show".to_string(), "显示主窗口"))
        .add_item(CustomMenuItem::new("hide".to_string(), "隐藏窗口"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "退出程序"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let id_str = id.as_str();
                let window = app.get_window("main").unwrap();
                match id_str {
                    "show" => {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    "hide" => {
                        window.hide().unwrap();
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
            let app = event.window().app_handle();
            let window = event.window();
            let _ = window.hide();
            api.prevent_close();
            let _ = app.emit("window-hidden", "");
        }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
