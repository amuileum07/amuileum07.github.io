// This file contains the logic for the online Python interpreter.

(async function() {
    const targetElement = document.getElementById("python-interpreter-target");
    if (!targetElement) {
        console.error("Target element #python-interpreter-target not found.");
        return;
    }

    targetElement.innerHTML = `
        <div class="python-interpreter-container">
            <div class="editor-panel">
                <textarea id="python-code-input" rows="15" placeholder="여기에 Python 코드를 입력하세요...">print('Hello, Pyodide!')
print(1 + 2)</textarea>
                <button id="run-python-btn">실행</button>
            </div>
            <div class="output-panel">
                <pre id="python-output"></pre>
                <p id="pyodide-status">Pyodide 로딩 중...</p>
            </div>
        </div>
    `;

    // Add styles dynamically for the interpreter UI
    const style = document.createElement('style');
    style.textContent = `
        .python-interpreter-container {
            display: flex;
            flex-direction: row; /* Default for wide screens */
            gap: 10px;
            width: 100%;
            min-height: 400px; /* Ensure enough height */
            border: 1px solid #333;
            background-color: #1e1e1e; /* VSCode-like dark background */
            color: #d4d4d4;
            font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', monospace;
            padding: 10px;
        }

        .editor-panel,
        .output-panel {
            flex: 1; /* Take equal space */
            display: flex;
            flex-direction: column;
            background-color: #1e1e1e;
            border-radius: 4px;
            overflow: hidden;
        }

        #python-code-input {
            flex: 1; /* Take all available space */
            width: 100%;
            background-color: #1e1e1e;
            color: #d4d4d4;
            border: none;
            padding: 10px;
            font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', monospace;
            font-size: 14px;
            resize: none; /* Disable textarea resize handle */
            outline: none;
        }

        #run-python-btn {
            background-color: #007acc; /* VSCode blue */
            color: white;
            border: none;
            padding: 8px 15px;
            cursor: pointer;
            font-size: 14px;
            border-radius: 4px;
            margin-top: 5px;
            align-self: flex-end; /* Align button to the right */
        }

        #run-python-btn:hover {
            background-color: #005f99;
        }

        #python-output {
            flex: 1; /* Take all available space */
            background-color: #000; /* Terminal-like black background */
            color: #0f0; /* Green text for output */
            padding: 10px;
            font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', monospace;
            font-size: 14px;
            white-space: pre-wrap; /* Preserve whitespace and wrap text */
            overflow-y: auto;
            border: 1px solid #333;
        }

        #pyodide-status {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
            text-align: right;
        }

        /* Responsive layout for narrow screens */
        @media (max-width: 768px) {
            .python-interpreter-container {
                flex-direction: column; /* Stack vertically */
            }

            .editor-panel,
            .output-panel {
                min-height: 200px; /* Ensure panels have some height when stacked */
            }

            #run-python-btn {
                align-self: stretch; /* Stretch button full width */
            }
        }
    `;
    document.head.appendChild(style);

    const codeInput = document.getElementById("python-code-input");
    const runBtn = document.getElementById("run-python-btn");
    const outputPre = document.getElementById("python-output");
    const statusP = document.getElementById("pyodide-status");

    let pyodide;

    // Function to append output to the pre tag
    function appendOutput(text) {
        outputPre.textContent += text + '\n';
        outputPre.scrollTop = outputPre.scrollHeight; // Scroll to bottom
    }

    try {
        // Dynamically load pyodide.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'; // CDN URL
        document.head.appendChild(script);

        script.onload = async () => {
            statusP.textContent = "Pyodide 초기화 중...";
            pyodide = await window.loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
                stdout: appendOutput, // Redirect stdout
                stderr: appendOutput  // Redirect stderr
            });
            statusP.textContent = "Pyodide 준비 완료!";
            runBtn.disabled = false;
        };

        script.onerror = () => {
            statusP.textContent = "Pyodide 로드 실패!";
            console.error("Failed to load pyodide.js from CDN");
        };

        runBtn.onclick = async () => {
            if (!pyodide) {
                outputPre.textContent = "오류: Pyodide가 로드되지 않았습니다.";
                return;
            }
            outputPre.textContent = ""; // Clear previous output
            statusP.textContent = "코드 실행 중...";
            runBtn.disabled = true;
            try {
                const result = await pyodide.runPythonAsync(codeInput.value);
                // Only display result if it's not undefined/null and not an empty string
                if (result !== undefined && result !== null && result.toString().trim() !== '') {
                    appendOutput(result.toString());
                }
            } catch (err) {
                appendOutput(`오류: ${err}`);
                console.error(err);
            } finally {
                statusP.textContent = "Pyodide 준비 완료!";
                runBtn.disabled = false;
            }
        };

        runBtn.disabled = true; // Disable until Pyodide is ready

    } catch (error) {
        statusP.textContent = "인터프리터 설정 중 오류 발생!";
        console.error("Error setting up interpreter:", error);
    }
})();
