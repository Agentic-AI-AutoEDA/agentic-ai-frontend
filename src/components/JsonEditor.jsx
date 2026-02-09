import Editor from '@monaco-editor/react';
import '../styles/SchemaMetadata.css';
import {useRef} from "react";
import Button from "./common/Button.jsx";

const JsonEditor = ({
                        title,
                        value,
                        onChange,
                        onSave,
                        onCancel,
                        saving = false,
                        validationError = null,
                        message = '',
                        error = '',
                        label = 'JSON',
                        height = '400px',
                    }) => {
    const editorRef = useRef(null);

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
    };

    const handleBeforeMount = (monaco) => {
        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {},
        });
    };

    return (
        <div className="schema-metadata-container">
            <div className="schema-metadata-header">
                <h4>{title}</h4>
                <div>
                    <Button onClick={onCancel} disabled={saving}>
                        Cancel </Button>
                </div>
            </div>
            <div className="schema-content">
                {error && <div className="schema-error-message">{error}</div>}
                {message && <div className="schema-status success">{message}</div>}
                {validationError && (
                    <div className="schema-error-message">{validationError}</div>
                )}
                <div className="schema-editor-wrapper">
                    <div className="schema-editor-label">{label}</div>
                    <Editor height={height}
                            defaultLanguage="json"
                            value={value}
                            onChange={onChange}
                            onMount={handleEditorMount}
                            beforeMount={handleBeforeMount}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize:14,
                                tabSize:2,
                                formatOnPaste: true,
                                autoClosingBrackets: 'always',
                                wordWrap: 'on',
                            }}
                    />
                </div>
                <div className="schema-button-group">
                    <Button onClick={onSave} disabled={saving || validationError !== null}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default JsonEditor;
