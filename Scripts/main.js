const rubyfmt = require("./rubyfmt");

exports.activate = function () {
  const replaceDocument = (editor, text) => {
    const documentSpan = new Range(0, editor.document.length);
    editor.edit((edit) => {
      edit.replace(documentSpan, text);
    });
  };

  const notifyError = (message) => {
    let notification = new NotificationRequest("rubyfmt-error");
    notification.title = nova.localize("rubyfmt Error");
    notification.body = nova.localize(message);
    notification.actions = [nova.localize("OK")];
    nova.notifications.add(notification);
    console.error(message);
  };

  const formatDocument = (editor) => {
    const documentSpan = new Range(0, editor.document.length);
    const documentText = editor.document.getTextInRange(documentSpan);
    return rubyfmt(documentText)
      .then((formattedText) => replaceDocument(editor, formattedText))
      .catch(notifyError);
  };

  const shouldFormatOnSave = (nova) => {
    const workspaceFormatOnSave = nova.workspace.config.get(
      "com.edwardloveall.rubyfmt.formatOnSave",
      "string"
    );
    const globalFormatOnSave = nova.config.get(
      "com.edwardloveall.rubyfmt.formatOnSave",
      "boolean"
    );
    if (workspaceFormatOnSave === "global") return globalFormatOnSave;
    if (workspaceFormatOnSave === "enabeled") return true;
    if (workspaceFormatOnSave === "disabled") return false;
    return false;
  };

  nova.workspace.onDidAddTextEditor((editor) => {
    if (editor.document.syntax != "ruby") return;

    editor.onWillSave((editor) => {
      if (shouldFormatOnSave(nova)) {
        return formatDocument(editor);
      }
    });
  });

  nova.commands.register("rubyfmt.format", formatDocument);
};
