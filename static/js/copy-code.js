document.addEventListener("click", async (event) => {
  const button = event.target.closest(".book-codeblock-copy");
  if (!button) return;

  const block = button.closest(".book-codeblock");
  const code = block?.querySelector("pre code");
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code.textContent);

    button.textContent = "Copied!";
    button.disabled = true;

    setTimeout(() => {
      button.textContent = "Copy";
      button.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy code:", error);
    button.textContent = "Failed";
  }
});