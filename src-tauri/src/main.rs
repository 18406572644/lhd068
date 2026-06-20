#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::WindowEvent;

fn main() {
    tauri::Builder::default()
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                let window = event.window();
                let _ = window.hide();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
