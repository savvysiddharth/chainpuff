function makeButtonLoad(message, buttonId) {
  const button = document.querySelector("#"+buttonId);
  const updatedContent = '<div class="lds-hourglass"></div>' + '  &nbsp;&nbsp;&nbsp;' + message;
  button.innerHTML = updatedContent;
}

function makeButtonNormal(message, buttonId) {
  const button = document.querySelector("#"+buttonId);
  button.innerHTML = message;
}