/**
 * Code.gs - Volledige code voor de Google Workspace Add-on
 * - Voorvoegsel verwijderen (door gebruiker opgegeven)
 * - Sequentieel hernoemen (oplopend/aflopend, basisnaam door gebruiker)
 * - Optie om "eindstuk" (na laatste punt) te behouden bij sequentieel hernoemen
 * - Natuurlijke sortering voor bestanden
 * - Weergave projectnaam/versie
 * - Input validatie
 */

// !!! BELANGRIJK: Werk deze constante bij voor elke nieuwe versie/implementatie !!!
const ADDON_PROJECT_NAME_VERSION = "Drive Bulk File Rename 0.16"; // Pas dit aan!

/**
 * Creëert de hoofdkaart voor de Add-on interface.
 * Wordt aangeroepen door de homepageTrigger in het manifest.
 * @param {Object} e Het event object (kan context bevatten).
 * @return {Card} De gebouwde kaart.
 */
function createRenamerCard(e) {
  const builder = CardService.newCardBuilder();
  builder.setHeader(CardService.newCardHeader().setTitle('Drive Bestandshernoemer'));

  // --- Sectie 1: Voorvoegsel Verwijderen ---
  const prefixSection = CardService.newCardSection().setHeader('1. Voorvoegsel Verwijderen');
  prefixSection.addWidget(CardService.newTextInput()
      .setFieldName('customPrefixInput')
      .setTitle('Te Verwijderen Voorvoegsel')
      .setHint('Bijv: Kopie van , Copy of ')
      .setValue("Kopie van "));
  prefixSection.addWidget(CardService.newTextInput()
      .setFieldName('folderIdPrefixInput')
      .setTitle('Map ID (Voorvoegsel)')
      .setHint('Plak hier de ID van de map'));
  prefixSection.addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
          .setText('Verwijder Voorvoegsel')
          .setOnClickAction(CardService.newAction().setFunctionName('handleRemovePrefixAction'))
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)));
  builder.addSection(prefixSection);

  // --- Sectie 2: Sequentieel Hernoemen ---
  const sequentialSection = CardService.newCardSection().setHeader('2. Sequentieel Hernoemen');
  sequentialSection.addWidget(CardService.newTextInput()
      .setFieldName('folderIdSequentialInput')
      .setTitle('Map ID (Sequentieel)')
      .setHint('Plak hier de ID van de map'));
  sequentialSection.addWidget(CardService.newTextInput()
      .setFieldName('baseNameInput')
      .setTitle('Nieuwe Basisnaam')
      .setHint('Bijv: Vakantiefoto'));
  sequentialSection.addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .setTitle("Volgorde Indexering")
      .setFieldName("reverseOrderCheckbox")
      .addItem("Aflopende index (n -> 1)", "true", false));
  sequentialSection.addWidget(CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.CHECK_BOX)
      .setTitle("Origineel 'eindstuk' behouden")
      .setFieldName("keepOriginalEndingCheckbox")
      .addItem("Behoud deel na laatste punt", "true", true)); // Standaard aangevinkt
  sequentialSection.addWidget(CardService.newTextParagraph()
      .setText("<small><i><b>'Eindstuk' behouden:</b> Vink aan om het deel van de originele naam na de laatste punt (bijv. '.pdf', maar ook '.deel.met.punten') aan de nieuwe naam toe te voegen.<br>Laat uitgevinkt als bestanden geen traditionele extensie hebben (zoals Google Docs/Sheets) of als je dit deel volledig wilt vervangen.</i></small>"));
  sequentialSection.addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
          .setText('Hernoem Sequentieel')
          .setOnClickAction(CardService.newAction().setFunctionName('handleSequentialRenameAction'))));
  builder.addSection(sequentialSection);

  // --- Sectie voor Project/Versie Informatie Onderaan ---
  const versionInfoSection = CardService.newCardSection();
  versionInfoSection.addWidget(CardService.newTextParagraph()
      .setText("<font color=\"#757575\"><small>" + ADDON_PROJECT_NAME_VERSION + "</small></font>"));
  builder.addSection(versionInfoSection);

  return builder.build();
}

/**
 * Verwerkt het verwijderen van een voorvoegsel van bestandsnamen.
 * @param {Object} e Het event object met formulierinvoer.
 */
function handleRemovePrefixAction(e) {
  const folderId = e.formInputs.folderIdPrefixInput[0];
  const customPrefix = e.formInputs.customPrefixInput[0];

  if (!folderId || folderId.trim() === '') {
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Fout: Map ID (Voorvoegsel) is vereist.'))
        .build();
  }
  if (customPrefix === "") { // Check op expliciet lege string
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Geef a.u.b. een voorvoegsel op om te verwijderen. Een leeg voorvoegsel zal geen bestanden hernoemen.'))
        .build();
  }
  if (customPrefix === null || typeof customPrefix === 'undefined') { // Fallback check
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Fout: Voorvoegsel input niet gevonden.'))
        .build();
  }

  const prefixToRemove = customPrefix; // Gebruik de input exact zoals gegeven
  let renamedCount = 0;
  let folderName = 'onbekende map';
  try {
    const folder = DriveApp.getFolderById(folderId.trim());
    folderName = folder.getName();
    const files = folder.getFiles();
    let filesFound = false;

    while (files.hasNext()) {
      filesFound = true;
      const file = files.next();
      const originalName = file.getName();

      if (originalName.startsWith(prefixToRemove)) {
        const nameAfterPrefix = originalName.substring(prefixToRemove.length);
        const finalNewName = nameAfterPrefix; // Strikte verwijdering, geen extra trim hier

        if (finalNewName !== '' && file.getName() !== finalNewName) {
          try {
            file.setName(finalNewName);
            renamedCount++;
            Logger.log(`Voorvoegsel "${prefixToRemove}" verwijderd: "${originalName}" -> "${finalNewName}" in map ${folderId}`);
          } catch (renameError) {
             Logger.log(`Kon bestand "${originalName}" niet hernoemen naar "${finalNewName}" (prefix verwijderen): ${renameError}`);
          }
        } else if (finalNewName === '') {
            Logger.log(`Overslaan: Het verwijderen van voorvoegsel "${prefixToRemove}" van "${originalName}" resulteert in een lege naam.`);
        } else if (file.getName() === finalNewName) {
            Logger.log(`Overslaan: Na verwijderen van voorvoegsel "${prefixToRemove}" van "${originalName}", is resulterende naam "${finalNewName}" identiek.`);
        }
      }
    }

    if (!filesFound && renamedCount === 0) { // Als er geen bestanden waren om te beginnen
         return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification().setText(`Info: Geen bestanden gevonden in map "${folderName}".`))
            .build();
    }

    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`${renamedCount} bestand(en) hernoemd in map "${folderName}".`))
        .build();

  } catch (error) {
    Logger.log(`Fout bij verwijderen prefix "${prefixToRemove}" in map ${folderId}: ${error}`);
    if (error.message.toLowerCase().includes("not found") || error.message.toLowerCase().includes("argument non valido")) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`Fout: Map ID "${folderId}" niet gevonden of ongeldig.`))
        .build();
    }
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`Fout: Kon map niet verwerken. Details: ${error.message}`))
        .build();
  }
}

/**
 * Verwerkt het sequentieel hernoemen van bestanden.
 * @param {Object} e Het event object met formulierinvoer.
 */
function handleSequentialRenameAction(e) {
  const folderId = e.formInputs.folderIdSequentialInput[0];
  const baseName = e.formInputs.baseNameInput[0];
  const reverseOrder = e.formInputs.reverseOrderCheckbox && e.formInputs.reverseOrderCheckbox[0] === "true";
  const keepOriginalEnding = e.formInputs.keepOriginalEndingCheckbox && e.formInputs.keepOriginalEndingCheckbox[0] === "true";

  if (!folderId || folderId.trim() === '') {
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Fout: Map ID (Sequentieel) is vereist.'))
        .build();
  }
   if (!baseName || baseName.trim() === '') {
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText('Fout: Nieuwe basisnaam is vereist.'))
        .build();
  }

  let renamedCount = 0;
  let folderName = 'onbekende map';
  let totalFiles = 0;
  try {
    const folder = DriveApp.getFolderById(folderId.trim());
    folderName = folder.getName();
    const filesIterator = folder.getFiles();
    const filesArray = [];

    while (filesIterator.hasNext()) {
        filesArray.push(filesIterator.next());
    }
    totalFiles = filesArray.length;

    if (totalFiles === 0) {
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification().setText(`Info: Geen bestanden gevonden in map "${folderName}".`))
            .build();
    }

    // Sorteer bestanden met natuurlijke sortering
    filesArray.sort(function(a, b) {
      const nameA = a.getName();
      const nameB = b.getName();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });

    for (let i = 0; i < totalFiles; i++) {
        const file = filesArray[i];
        const originalName = file.getName();
        
        let extension = "";
        if (keepOriginalEnding) {
            extension = getFileExtension(originalName);
        }
        
        let currentIndexNumber;
        if (reverseOrder) {
            currentIndexNumber = totalFiles - i;
        } else {
            currentIndexNumber = i + 1;
        }
        
        const newName = `${baseName.trim()} [${currentIndexNumber}]${extension}`;

         try {
            if (file.getName() !== newName) {
                file.setName(newName);
                renamedCount++;
                Logger.log(`Sequentieel hernoemd: "${originalName}" -> "${newName}" (Eindstuk behouden: ${keepOriginalEnding}, Volgorde: ${reverseOrder ? 'aflopend' : 'oplopend'}) in map ${folderId}`);
            } else {
                Logger.log(`Overslaan (Sequentieel): "${originalName}" is al "${newName}" in map ${folderId}`);
            }
          } catch (renameError) {
             Logger.log(`Kon bestand "${originalName}" niet sequentieel hernoemen naar "${newName}": ${renameError}`);
          }
    }

    const orderDescription = reverseOrder ? "aflopende" : "oplopende";
    const endingDescription = keepOriginalEnding ? "met behoud van origineel eindstuk" : "zonder origineel eindstuk";
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`${renamedCount} van ${totalFiles} bestand(en) sequentieel hernoemd in map "${folderName}" ${endingDescription} (in ${orderDescription} volgorde).`))
        .build();

  } catch (error) {
    Logger.log(`Fout bij sequentieel hernoemen in map ${folderId}: ${error}`);
    if (error.message.toLowerCase().includes("not found") || error.message.toLowerCase().includes("argument non valido")) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`Fout: Map ID "${folderId}" niet gevonden of ongeldig.`))
        .build();
    }
    return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification().setText(`Fout: Kon map niet sequentieel verwerken. Details: ${error.message}`))
        .build();
  }
}

/**
 * Helper functie om de bestandsextensie te krijgen (alles na de laatste punt).
 * @param {string} filename De volledige bestandsnaam.
 * @return {string} De extensie (bijv. ".pdf", ".deelNaPunt") of een lege string.
 */
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot < 1 || lastDot === filename.length - 1) { // Geen punt, of punt aan begin/eind
    return '';
  }
  return filename.substring(lastDot); // Pakt alles VANAF de laatste punt
}

/**
 * Deze functie is nodig voor de homepageTrigger in het manifest.
 * Het zorgt ervoor dat de kaart wordt getoond wanneer de add-on wordt geopend.
 * @param {Object} e Het event object.
 * @return {Card} De kaart die getoond moet worden.
 */
function onHomepage(e) {
  Logger.log('Homepage trigger aangeroepen.');
  return createRenamerCard(e); // Zorg ervoor dat dit een enkele kaart retourneert, geen array
}
