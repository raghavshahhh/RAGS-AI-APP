// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem};

// Global state for managing processes
struct AppState {
    processes: Mutex<HashMap<String, std::process::Child>>,
}

#[tauri::command]
async fn start_rags(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let mut processes = state.processes.lock().unwrap();
    
    // Check if already running
    if processes.contains_key("rags") {
        return Ok("RAGS is already running".to_string());
    }
    
    // Start Ollama first
    let ollama_child = Command::new("ollama")
        .args(["serve"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {}", e))?;
    
    processes.insert("ollama".to_string(), ollama_child);
    
    // Wait a bit for Ollama to start
    std::thread::sleep(std::time::Duration::from_secs(3));
    
    // Start RAGS backend
    let child = Command::new("npm")
        .args(["start"])
        .current_dir("../backend")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start RAGS: {}", e))?;
    
    processes.insert("rags".to_string(), child);
    Ok("RAGS and Ollama started successfully".to_string())
}

#[tauri::command]
async fn stop_rags(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let mut processes = state.processes.lock().unwrap();
    
    // Stop RAGS backend
    if let Some(mut child) = processes.remove("rags") {
        child.kill().map_err(|e| format!("Failed to stop RAGS: {}", e))?;
    }
    
    // Stop Ollama
    if let Some(mut child) = processes.remove("ollama") {
        child.kill().map_err(|e| format!("Failed to stop Ollama: {}", e))?;
    }
    
    Ok("RAGS and Ollama stopped successfully".to_string())
}

fn main() {
    // Create system tray
    let quit = CustomMenuItem::new("quit".to_string(), "Quit RAGS AI");
    let show = CustomMenuItem::new("show".to_string(), "Show RAGS AI");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState {
            processes: Mutex::new(HashMap::new()),
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            tauri::SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Hide window instead of closing
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            start_rags,
            stop_rags
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

