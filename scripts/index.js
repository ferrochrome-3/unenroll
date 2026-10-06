// made by trollmeight
// feel free to use this code, as long as you credit me

const recovery_keys = {};

async function importkeys() {
  try {
    recovery_keys.file = await fetch('/databases/recoverykey.json');
    if (!recovery_keys.file.ok) {
      throw new Error(`I have fallen and I can't get up! (file didn't load correctly)`);
    }
    recovery_keys.data = await recovery_keys.file.json();

    recovery_keys.listfile = await fetch('/databases/listdb.json');
    if (!recovery_keys.listfile.ok) {
      throw new Error(`I have fallen and I can't get up! (file didn't load correctly)`);
    }
    recovery_keys.listdata = await recovery_keys.listfile.json();
  } catch (error) {
    console.error("I have fallen and I can't get up!", error);
  }
}

export function isitkeyrolled(boardname, keyprefix) {
  recovery_keys.boardname = boardname.trim().toLowerCase();
  recovery_keys.prefix = keyprefix.trim().toLowerCase().slice(0, 3);

  if (!recovery_keys.boardname || !recovery_keys.prefix) {
    return "invalid";
  }

  if (!recovery_keys.data || !recovery_keys.data[recovery_keys.boardname]) {
    return "invalid";
  }

  recovery_keys.boarddata = recovery_keys.data[recovery_keys.boardname];

  if (recovery_keys.boarddata.devkeys && recovery_keys.boarddata.devkeys.startsWith(recovery_keys.prefix)) {
    return 'yes';
  } else if (recovery_keys.boarddata.unkeyrolled && recovery_keys.boarddata.unkeyrolled.startsWith(recovery_keys.prefix)) {
    return "no";
  } else if (recovery_keys.boarddata.keyrolled && recovery_keys.boarddata.keyrolled.startsWith(recovery_keys.prefix)) {
    return 'yes';
  }

  return "no";
}

export function findlistmatches(boardname, keyprefix, kernver) {
  recovery_keys.boardname = boardname.trim().toLowerCase();
  recovery_keys.kernver = kernver.trim().toLowerCase();
  recovery_keys.keyrolledstatus = isitkeyrolled(boardname, keyprefix);

  if (!recovery_keys.listdata) {
    return [];
  }

  recovery_keys.matches = [];

  for (const key in recovery_keys.listdata) {
    recovery_keys.item = recovery_keys.listdata[key];
    
    recovery_keys.boardlist = (recovery_keys.item.boards || "").toLowerCase().split(",").map(b => b.trim());
    recovery_keys.kernlist = (recovery_keys.item.kernver || "").toLowerCase().split(",").map(k => k.trim());
    recovery_keys.itemkeyrolled = (recovery_keys.item.keyrolled || "").toLowerCase().trim();

    recovery_keys.boardmatch = !recovery_keys.boardname || recovery_keys.boardlist.includes("all") || recovery_keys.boardlist.includes(recovery_keys.boardname);
    recovery_keys.kernmatch = !recovery_keys.kernver || recovery_keys.kernlist.includes("all") || recovery_keys.kernlist.includes(recovery_keys.kernver);
    recovery_keys.keyrolledmatch = !recovery_keys.itemkeyrolled || recovery_keys.itemkeyrolled === "both" || recovery_keys.itemkeyrolled === recovery_keys.keyrolledstatus;

    if (recovery_keys.boardmatch && recovery_keys.kernmatch && recovery_keys.keyrolledmatch) {
      recovery_keys.matches.push(recovery_keys.item);
    }
  }

  return recovery_keys.matches;
}

await importkeys();

recovery_keys.button = document.getElementById("checkbutton");
recovery_keys.baseboardname = document.getElementById("baseboardname");
recovery_keys.recoverykey = document.getElementById("recoverykey");
recovery_keys.kernelver = document.getElementById("kernelver");
recovery_keys.response = document.getElementById("response");

recovery_keys.button.addEventListener("click", () => {
  if (!recovery_keys.baseboardname.value.trim() || !recovery_keys.recoverykey.value.trim() || !recovery_keys.kernelver.value.trim()) {
    recovery_keys.response.innerHTML = `
      <div class="card cardempty">
        Are you sure that you have filled out all of the data correctly?
      </div>
    `;
    return;
  }

  recovery_keys.cards = findlistmatches(
    recovery_keys.baseboardname.value,
    recovery_keys.recoverykey.value,
    recovery_keys.kernelver.value
  );

  recovery_keys.html = "";

  if (recovery_keys.cards.length > 0) {
    recovery_keys.cards.forEach(item => {
      recovery_keys.boardarray = (item.boards || "").split(",").map(b => b.trim()).filter(Boolean);
      recovery_keys.displayboards = recovery_keys.boardarray.map(b => b.toLowerCase()).includes("all") ? "all" : (recovery_keys.boardarray.length > 1 ? "multiple" : (recovery_keys.boardarray[0] || ""));

      recovery_keys.kernarray = (item.kernver || "").split(",").map(k => k.trim()).filter(Boolean);
      recovery_keys.displaykern = recovery_keys.kernarray.map(k => k.toLowerCase()).includes("all") ? "all" : (recovery_keys.kernarray.length > 1 ? "multiple" : (recovery_keys.kernarray[0] || ""));

      recovery_keys.devmarkup = item.developer 
        ? `<span>developed by: ${item.developer}</span><span class="separator">•</span>` 
        : '';

      recovery_keys.descmarkup = item.description 
        ? `<div class="carddesc">${item.description}</div>` 
        : '';

      recovery_keys.keyrolledvalue = item.keyrolled || recovery_keys.keyrolledstatus || 'no';

      recovery_keys.html += `
        <div class="card">
          <div class="cardtitle">${item.name || ''}</div>
          ${recovery_keys.descmarkup}
          <div class="cardfooter">
            <span>boards: ${recovery_keys.displayboards}</span>
            <span class="separator">•</span>
            <span>kernver: ${recovery_keys.displaykern}</span>
            <span class="separator">•</span>
            <span>keyrolled: ${recovery_keys.keyrolledvalue}</span>
            <span class="separator">•</span>
            ${recovery_keys.devmarkup}
            <a href="${item.link || '#'}" target="_blank">Link</a>
          </div>
        </div>
      `;
    });
  } else {
    recovery_keys.html = `
      <div class="card cardempty">
        Sorry, there aren't any exploits that you can use at this time :(
      </div>
    `;
  }

  recovery_keys.response.innerHTML = recovery_keys.html;
});