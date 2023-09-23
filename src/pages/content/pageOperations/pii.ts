function temporarilyHighlightObscuredPii(document: Document) {
  const obscuredPii = document.getElementsByClassName(
    "screenshot-studio-obscured-pii"
  );
  if (obscuredPii) {
    for (let i = 0; i < obscuredPii.length; i++) {
      const element = obscuredPii[i] as HTMLElement;
      element.style.backgroundColor = "yellow";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 5000);
    }
  }
}

function obscureIpAddressesOnPage(document: Document) {
  const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
  const ipAddresses = document.body.innerText.match(ipRegex);
  if (ipAddresses) {
    ipAddresses.forEach((ipAddress) => {
      document.body.innerHTML = document.body.innerHTML.replace(
        ipAddress,
        "<span class='screenshot-studio-obscured-pii'>0.0.0.0</span>"
      );
    });
  }
}

function obscureEmailAddressesOnPage(document: Document) {
  const emailRegex = /\S+@\S+\.\S+/g;
  const emailAddresses = document.body.innerText.match(emailRegex);
  if (emailAddresses) {
    emailAddresses.forEach((emailAddress) => {
      document.body.innerHTML = document.body.innerHTML.replace(
        emailAddress,
        "<span class='screenshot-studio-obscured-pii'>user@example.com</span>"
      );
    });
  }
}

export function obscurePii(document: Document) {
  obscureIpAddressesOnPage(document);
  obscureEmailAddressesOnPage(document);
  temporarilyHighlightObscuredPii(document);
}
