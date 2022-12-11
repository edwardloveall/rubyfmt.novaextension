const rubyfmt = (inputText) => {
  const setUpProcess = (reject) => {
    const workspaceConfigPath = nova.workspace.config.get(
      "com.edwardloveall.rubyfmt.rubyfmtPath"
    );
    const globalConfigPath = nova.config.get(
      "com.edwardloveall.rubyfmt.rubyfmtPath"
    );
    const configPath = workspaceConfigPath || globalConfigPath;
    if (configPath.trim() === "") {
      const message =
        "Please provide a rubyfmt executable in Project Settings to enable formatting.";
      reject(message);
    }
    const rubyfmtPath = nova.path.expanduser(configPath);

    return new Process(rubyfmtPath, {
      args: ["--header-opt-out", "--"],
      stdio: "pipe",
    });
  };

  const writeToStdin = (process, inputText) => {
    const writer = process.stdin.getWriter();
    writer.ready.then(() => {
      writer.write(inputText);
      writer.close();
    });
  };

  const collectOutputText = (stdout, buffer) => (buffer.stdout += stdout);
  const collectErrorText = (stderr, buffer) => (buffer.stderr += stderr);

  return new Promise((resolve, reject) => {
    try {
      const process = setUpProcess(reject);
      let buffer = { stdout: "", stderr: "" };

      process.onStdout((stdout) => collectOutputText(stdout, buffer));
      process.onStderr((stderr) => collectErrorText(stderr, buffer));
      process.onDidExit((status) => {
        if (status === 0) {
          resolve(buffer.stdout);
        } else {
          reject(buffer.stderr);
        }
      });
      writeToStdin(process, inputText);
      process.start();
    } catch (err) {
      reject(err.toString());
    }
  });
};

module.exports = rubyfmt;
