import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../../api.js';
import '../../styles/Files.css';
import Button from "../common/Button .jsx";

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

const FileDetails = ({ navigate }) => {
    const { fileName } = useParams();
    const [fileId, setFileId] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFileId = async () => {
            try {
                const response = await api.get('resources/files/');
                const file = (response.data.data || []).find(
                    f => f.original_filename === decodeURIComponent(fileName)
                );
                if (file) {
                    setFileId(file.id);
                } else {
                    setError('File not found');
                }
            } catch {
                setError('Failed to fetch file info');
            }
        };
        fetchFileId();
    }, [fileName]);

    useEffect(() => {
        if (fileId === null) return;
        setLoading(true);
        setError(null);
        const fetchFile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`resources/files/${fileId}/read/`, {
                    responseType: 'arraybuffer',
                    validateStatus: () => true,
                });
                const text = new TextDecoder('utf-8').decode(response.data);
                try {
                    const json = JSON.parse(text);
                    if (json.status === 413) {
                        setError('File too large to display (max 10MB).');
                        setData(null);
                        return;
                    }
                } catch {
                    // Not JSON
                }
                let csvString = text;
                let parsed = parseCSV(csvString, ',');
                if (parsed.columns.length === 1) {
                    const decoder = new TextDecoder('latin1');
                    csvString = decoder.decode(response.data);
                    parsed = parseCSV(csvString, ';');
                }
                setData(parsed);
            } catch (err) {
                setError('Failed to load file: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [fileId]);

    if (loading) return <p>Loading file...</p>;
    if (error) {
        return (
            <div className="full-content">
                <div className="full-content-header">
                    <button onClick={() => navigate(-1)}>Back</button>
                </div>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="full-content">
            <div className="full-content-header">
                <h4>{decodeURIComponent(fileName)}</h4>
                <Button onClick={() => navigate(-1)}>
                    Back
                </Button>
            </div>
            <div className="table-wrapper">
                <table>
                    <thead>
                    <tr>
                        {data.columns.map((col, idx) => (
                            <th key={idx}>{col}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {data.rows.map((row, idx) => (
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
    );
};

export default FileDetails;
