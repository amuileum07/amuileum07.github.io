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
                <div id="codemirror-editor-container" style="flex: 1; overflow: hidden;"></div>
                <button id="run-python-btn">실행</button>
            </div>
            <div class="output-panel">
                <pre id="python-output"></pre>
                <div id="plot-output"></div>
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

        .CodeMirror {
            height: 100%;
            font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', monospace;
            font-size: 14px;
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
            flex: 1;
            min-height: 100px;
            background-color: #000; /* Terminal-like black background */
            color: #0f0; /* Green text for output */
            padding: 10px;
            font-family: 'Consolas', 'Monaco', 'Ubuntu Mono', monospace;
            font-size: 14px;
            white-space: pre-wrap; /* Preserve whitespace and wrap text */
            overflow-y: auto;
            border: 1px solid #333;
        }

        #plot-output {
            flex-shrink: 0;
            padding: 10px;
            text-align: center;
        }

        #plot-output img {
            max-width: 100%;
            background-color: white;
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

    // Load CodeMirror CSS
    const cmCss = document.createElement('link');
    cmCss.rel = 'stylesheet';
    cmCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.css';
    document.head.appendChild(cmCss);

    const cmThemeCss = document.createElement('link');
    cmThemeCss.rel = 'stylesheet';
    cmThemeCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/theme/monokai.min.css';
    document.head.appendChild(cmThemeCss);


    const runBtn = document.getElementById("run-python-btn");
    const outputPre = document.getElementById("python-output");
    const plotOutput = document.getElementById("plot-output");
    const statusP = document.getElementById("pyodide-status");

    let pyodide;
    let editor;
    let pyodideReady = false;
    let editorReady = false;

    function checkReady() {
        if (pyodideReady && editorReady) {
            statusP.textContent = "Pyodide 준비 완료!";
            runBtn.disabled = false;
        }
    }

    function appendOutput(text) {
        outputPre.textContent += text + '\n';
        outputPre.scrollTop = outputPre.scrollHeight; // Scroll to bottom
    }

    try {
        // Load pyodide
        const pyodideScript = document.createElement('script');
        pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        document.head.appendChild(pyodideScript);

        pyodideScript.onload = async () => {
            statusP.textContent = "Pyodide 초기화 중...";
            pyodide = await window.loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
                stdout: appendOutput,
                stderr: appendOutput
            });
            pyodideReady = true;
            checkReady();
        };

        pyodideScript.onerror = () => {
            statusP.textContent = "Pyodide 로드 실패!";
            console.error("Failed to load pyodide.js from CDN");
        };

        // Load CodeMirror
        const cmScript = document.createElement('script');
        cmScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js';
        document.head.appendChild(cmScript);

        cmScript.onload = () => {
            const cmPythonScript = document.createElement('script');
            cmPythonScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/python/python.min.js';
            document.head.appendChild(cmPythonScript);

            cmPythonScript.onload = () => {
                editor = CodeMirror(document.getElementById('codemirror-editor-container'), {
                    value: "import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 2 * np.pi, 100)\ny = np.sin(x)\n\nplt.plot(x, y)\nplt.title(\"Sine Wave\")\nplt.xlabel(\"X-axis\")\nplt.ylabel(\"Y-axis\")\nplt.grid(True)\n\n# To display the plot, call plt.show() at the end.\nplt.show()",
                    mode:  "python",
                    theme: "monokai",
                    lineNumbers: true
                });
                editorReady = true;
                checkReady();
            };
        };

        runBtn.onclick = async () => {
            if (!pyodide || !editor) {
                outputPre.textContent = "오류: Pyodide 또는 에디터가 준비되지 않았습니다.";
                return;
            }

            outputPre.textContent = "";
            plotOutput.innerHTML = "";
            runBtn.disabled = true;

            try {
                const code = editor.getValue();
                const packages = [];
                if (code.includes("numpy")) packages.push("numpy");
                if (code.includes("matplotlib")) packages.push("matplotlib");

                if (packages.length > 0) {
                    statusP.textContent = `패키지 로딩 중: ${packages.join(', ')}...`;
                    await pyodide.loadPackage(packages);
                }

                statusP.textContent = "코드 실행 중...";

                const preamble = `
import io, base64
__plots__ = []
if 'matplotlib' in """${code}""":
    import matplotlib.pyplot as plt
    _old_show = plt.show
    def _new_show():
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        __plots__.append(base64.b64encode(buf.read()).decode('utf-8'))
        plt.clf()
    plt.show = _new_show
`;
                await pyodide.runPythonAsync(preamble);

                let result = await pyodide.runPythonAsync(code);

                const plots = pyodide.globals.get('__plots__').toJs();
                if (plots && plots.length > 0) {
                    plots.forEach(plot_b64 => {
                        const img = document.createElement('img');
                        img.src = 'data:image/png;base64,' + plot_b64;
                        plotOutput.appendChild(img);
                    });
                }

                if (result !== undefined && result !== null) {
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

        runBtn.disabled = true; // Disable until Pyodide and CodeMirror are ready

    } catch (error) {
        statusP.textContent = "인터프리터 설정 중 오류 발생!";
        console.error("Error setting up interpreter:", error);
    }
})();
