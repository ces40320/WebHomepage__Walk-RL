/*
 * Simple JavaScript to enhance interactivity on the WalkRL project page.
 *
 * This script provides clipboard copying functionality for the BibTeX citation.
 * When the user clicks the copy button, the BibTeX content is copied to the
 * clipboard and the button text changes temporarily to provide feedback.
 */

document.addEventListener('DOMContentLoaded', function () {
    const copyButton = document.getElementById('copyBib');
    const bibCode = document.querySelector('#citation code');

    if (copyButton && bibCode) {
        copyButton.addEventListener('click', function () {
            // Use the Clipboard API if available
            if (navigator.clipboard) {
                navigator.clipboard.writeText(bibCode.textContent.trim()).then(
                    function () {
                        const originalLabel = copyButton.textContent;
                        copyButton.textContent = 'Copied!';
                        // Reset label after 1.5 seconds
                        setTimeout(function () {
                            copyButton.textContent = originalLabel;
                        }, 1500);
                    },
                    function () {
                        alert('Unable to copy to clipboard');
                    }
                );
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = bibCode.textContent.trim();
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    const originalLabel = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    setTimeout(function () {
                        copyButton.textContent = originalLabel;
                    }, 1500);
                } catch (err) {
                    alert('Unable to copy to clipboard');
                }
                document.body.removeChild(textarea);
            }
        });
    }
});