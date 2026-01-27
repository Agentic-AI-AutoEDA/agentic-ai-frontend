import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import '../styles/Files.css';

const FileList = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalError, setGlobalError] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isNameHovered, setIsNameHovered] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [isPreviewHovered, setIsPreviewHovered] = useState(false);
    const [fullData, setFullData] = useState(null);
    const [fullLoading, setFullLoading] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState(null);
    const fileInputRef = useRef(null);
    const hoverTimeout = useRef(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await api.get('resource/files/');
            const fileData = Array.isArray(response.data.data) ? response.data.data : [];
            setFiles(fileData);
        } catch (err) {
            setGlobalError('Failed to fetch files: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileId) => {
        try {
            await api.delete(`resource/files/${fileId}/delete/`);
            setFiles(files.filter(file => file.id !== fileId));
        } catch (err) {
            setError('Failed to delete file: ' + err.message);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('resource/files/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fetchFiles();
        } catch (err) {
            setError('Failed to upload file: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleMouseEnter = async (fileId) => {
        setIsNameHovered(true);
        setPreviewLoading(true);
        try {
            const response = await api.get(`resource/files/${fileId}/preview/`);
            setPreview(response.data.data);
        } catch (err) {
            console.error('Failed to fetch preview: ' + err.message);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleMouseLeave = () => {
        setIsNameHovered(false);
        hoverTimeout.current = setTimeout(() => {
            if (!isPreviewHovered) {
                setPreview(null);
            }
        }, 100);
    };

    const handleMouseEnterPreview = () => {
        setIsPreviewHovered(true);
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

    const handleMouseLeavePreview = () => {
        setIsPreviewHovered(false);
        hoverTimeout.current = setTimeout(() => {
            if (!isNameHovered) {
                setPreview(null);
            }
        }, 100);
    };

    const parseCSV = (csvString, delimiter) => {
        const lines = csvString.trim().split('\n');
        const columns = lines[0].split(delimiter);
        const rows = lines.slice(1).map(line => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.replace(/^"|"$/g, ''));
            return result;
        });
        return { columns, rows };
    };

    const handleView = async (fileId, fileName) => {
        setFullLoading(true);
        setSelectedFileName(fileName);
        setError(null);
        setFullData(null);
        try {
            const response = await api.get(`resource/files/${fileId}/read/`, {
                responseType: 'arraybuffer',
                validateStatus: () => true,
            });

            const text = new TextDecoder('utf-8').decode(response.data);
            try {
                const json = JSON.parse(text);
                if (json.status === 413) {
                    setError('File too large to display (max 10MB).');
                    setFullData(null);
                    return;
                }
            } catch {
                // Not JSON response
            }
            let csvString = text;
            let parsedData = parseCSV(csvString, ',');
            if (parsedData.columns.length === 1) {
                const decoder = new TextDecoder('latin1');
                csvString = decoder.decode(response.data);
                parsedData = parseCSV(csvString, ';');
            }
            setFullData(parsedData);
        } catch (err) {
            console.error('Failed to read file: ' + err.message);
        } finally {
            setFullLoading(false);
        }
    };

    const handleBack = () => {
        setFullData(null);
        setSelectedFileName(null);
        setPreview(null);
        setPreviewLoading(false);
    };

    if (loading) return <p>Loading files...</p>;
    if (globalError) return <p>{globalError}</p>;

    return (
        <div className="file-list">
            {!fullData && (
                <>
                    <div className="upload-section">
                        <h3>Available Files</h3>
                        <button onClick={handleUploadClick} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>S No.</th>
                                <th>Name</th>
                                <th>Owner</th>
                                <th>Created At</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {files.map((file, index) => (
                                <tr key={file.id}>
                                    <td>{index + 1}</td>
                                    <td
                                        className="pointer"
                                        onMouseEnter={() => handleMouseEnter(file.id)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {file.original_filename}
                                    </td>
                                    <td>{file.owner_name}</td>
                                    <td>{new Date(file.created_at).toLocaleString()}</td>
                                    <td>
                                        <button onClick={() => handleView(file.id, file.original_filename)}>View</button>
                                        &nbsp;&nbsp;
                                        <button className="btn-delete" onClick={() => handleDelete(file.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {previewLoading && <p>Loading file preview...</p>}
                    {preview && (
                        <div
                            className="preview-popup"
                            onMouseEnter={handleMouseEnterPreview}
                            onMouseLeave={handleMouseLeavePreview}
                            onClick={() => handleView(preview.id, preview.filename)}
                        >
                            <h4>Preview: {preview.filename}</h4>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                    <tr>
                                        {preview.columns.map((col, idx) => (
                                            <th key={idx}>{col}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {preview.rows.map((row, idx) => (
                                        <tr key={idx}>
                                            {row.map((cell, cellIdx) => (
                                                <td key={cellIdx}>{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {!fullLoading && selectedFileName && error && <p className="error-message">{error}</p>}
                </>
            )}

            {fullLoading && <p>Loading full file...</p>}
            {fullData && !error && (
                <div className="full-content">
                    <div className="full-content-header">
                        <h4>{selectedFileName}</h4>
                        <button onClick={handleBack}>Back</button>
                    </div>

                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                {fullData.columns.map((col, idx) => (
                                    <th key={idx}>{col}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {fullData.rows.map((row, idx) => (
                                <tr key={idx}>
                                    {row.map((cell, cellIdx) => (
                                        <td key={cellIdx}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileList;
