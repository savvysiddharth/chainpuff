function makeButtonLoad(message, buttonId) {
  const button = document.querySelector("#"+buttonId);
  button.disabled = true;
  const updatedContent = '<div class="lds-hourglass"></div>' + '  &nbsp;&nbsp;&nbsp;' + message;
  button.innerHTML = updatedContent;
}

function makeButtonNormal(message, buttonId) {
  const button = document.querySelector("#"+buttonId);
  button.disabled = false;
  button.innerHTML = message;
}