import React, { useEffect, useRef, useState } from 'react';
import api from '../../api.js';
import '../../styles/Files.css';

const FileList = ({ navigate }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [isNameHovered, setIsNameHovered] = useState(false);
    const [isPreviewHovered, setIsPreviewHovered] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const hoverTimeout = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await api.get('resources/files/');
            const fileData = Array.isArray(response.data.data) ? response.data.data : [];
            setFiles(fileData);
        } catch (err) {
            setError('Failed to fetch files: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileId) => {
        try {
            await api.delete(`resources/files/${fileId}/delete/`);
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
        setUploadError(null);
        try {
            await api.post('resources/files/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fetchFiles();
        } catch (err) {
            setUploadError('Failed to upload file: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleMouseEnter = async (fileId) => {
        setIsNameHovered(true);
        setPreviewLoading(true);
        try {
            const response = await api.get(`resources/files/${fileId}/preview/`);
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


    if (loading) return <p>Loading files...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="file-list">
            <div className="upload-section">
                <h3>Available Files</h3>
                <input
                    type="file"
                    name="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                {uploadError && <p className="error-message">{uploadError}</p>}
            </div>
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
                                <button onClick={() => navigate(`file-detail/${encodeURIComponent(file.original_filename)}`)}>View</button>
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
                    onClick={() => navigate(`${encodeURIComponent(preview.filename)}`)}
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
        </div>
    );
};

export default FileList;
