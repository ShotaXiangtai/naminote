use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn notes_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("notes");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir)
}

// Extract filename only — prevents path traversal attacks
fn safe_filename(fp: &str) -> Result<String, String> {
    std::path::Path::new(fp)
        .file_name()
        .ok_or_else(|| "invalid filename".to_string())
        .map(|n| n.to_string_lossy().into_owned())
}

#[tauri::command]
fn save_note(app: AppHandle, data: serde_json::Value) -> Result<String, String> {
    let dir = notes_dir(&app)?;
    let ts = chrono::Local::now().format("%Y-%m-%dT%H-%M-%S").to_string();
    let filename = format!("note_{}.json", ts);
    let body = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(dir.join(&filename), body).map_err(|e| e.to_string())?;
    fs::write(dir.join("last.txt"), &filename).map_err(|e| e.to_string())?;
    Ok(filename)
}

#[tauri::command]
fn load_last(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let dir = notes_dir(&app)?;
    let last_txt = dir.join("last.txt");
    if !last_txt.exists() {
        return Ok(None);
    }
    let filename = fs::read_to_string(&last_txt)
        .map_err(|e| e.to_string())?
        .trim()
        .to_string();
    let path = dir.join(&filename);
    if !path.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_notes(app: AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let dir = notes_dir(&app)?;
    let mut entries: Vec<_> = fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| {
            let n = e.file_name().to_string_lossy().into_owned();
            n.starts_with("note_") && n.ends_with(".json")
        })
        .collect();
    // Reverse-chronological order
    entries.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    let mut result = Vec::new();
    for entry in entries {
        let filename = entry.file_name().to_string_lossy().into_owned();
        let content = match fs::read_to_string(entry.path()) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let mut data: serde_json::Value = match serde_json::from_str(&content) {
            Ok(d) => d,
            Err(_) => continue,
        };
        // Inject filename as "path" so the frontend can pass it back for load/delete
        if let serde_json::Value::Object(ref mut map) = data {
            map.insert("path".to_string(), serde_json::Value::String(filename));
        }
        result.push(data);
    }
    Ok(result)
}

#[tauri::command]
fn load_note(app: AppHandle, fp: String) -> Result<serde_json::Value, String> {
    let dir = notes_dir(&app)?;
    let filename = safe_filename(&fp)?;
    let content = fs::read_to_string(dir.join(&filename)).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_note(app: AppHandle, fp: String) -> Result<(), String> {
    let dir = notes_dir(&app)?;
    let filename = safe_filename(&fp)?;
    let path = dir.join(&filename);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_note,
            load_last,
            list_notes,
            load_note,
            delete_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
