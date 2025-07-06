((pdfjs) => {
  const contentDiv = document.querySelector("#content");
  const dropArea = document.querySelector("#drop-area");
  const reader = new FileReader()
    const fileUpload = document.querySelector("#file-upload")
  const downloadBtn = document.getElementById('download-btn');

  const filterTypeHeaderName = "Filter Type";
  const frequencyHeaderName = "Frequency";
  const gainHeaderName = "Gain";
  const qFactorHeaderName = "Q-Factor";
  const bandwidthHeaderName = "BW / S";

  var eqs = [];
  var preampGain = 0;

  var filename = "eq-preset";

  function extract(src) {
    getContent(src)
      .then((content) => {
        let items = content.items;
        // The items first Filter Settings, then the table row by row.

        assertEquals(items[0].str, "Filter Settings");
        assertEquals(items[1].str, filterTypeHeaderName);
        assertEquals(items[2].str, frequencyHeaderName);
        assertEquals(items[3].str, gainHeaderName);
        assertEquals(items[4].str, qFactorHeaderName);
        assertEquals(items[5].str, bandwidthHeaderName);

        let bandCounter = 0;
        let rowY = 0;
        let columnCounter = 0;
        let tmpEq = {
          type: null,
          frequency: null,
          gain: null,
          q: null,
          bw: null,
        };
        for (let index = 6; index < items.length; index++) {
          const element = items[index];
          if (element.str == `Band ${bandCounter+1}`) {
            //new row
            bandCounter++;
            columnCounter = 0;
            rowY = element.transform[5];
            tmpEq = {
              type: null,
              frequency: null,
              gain: null,
              q: null,
              bw: null,
            };
            eqs.push(tmpEq);
            continue;
          }

        if(element.transform[5] != rowY) {
            console.error("element found with wrong yPos", element);
        }

          switch (columnCounter) {
            case 0:
              tmpEq.type = element.str;
              break;
            case 1:
              tmpEq.frequency = element.str;
              break;
            case 2:
              tmpEq.gain = element.str;
              break;
            case 3:
              tmpEq.q = element.str;
              break;
            case 4:
              tmpEq.bw = element.str;
              break;
            default:
              break;
          }
          columnCounter++;
        }
        console.log(eqs);

        // TODO iterate over all items, find "Preamp gain:", save X and Y pos, search for all with closest X and Y one row apart. Maybe hardcode target coordinates and just search directly for that.
        items.forEach((item, i) => {
            if(item.str == "Pre-gain to avoid clipping:" || item.str == "Preamp gain:") {
                preampGain = items[i+1].str;
            }
        })
        
        contentDiv.innerHTML = "";
        // eqs.forEach((item, i) => {
        //     contentDiv.innerHTML += `${i}: ${JSON.stringify(item)}<br>`;
        //     //   console.log(item);
        //     });

        // content.items.forEach((item) => {
        //   contentDiv.innerHTML += `${item.str} - X: ${item.transform[4]} Y: ${item.transform[5]}<br>`;
        //   console.log(item);
        // });

        printEqApoSettings(eqs, preampGain);
      })
      .catch((error) => {
        console.log(error);
      }); // handle errors
  }

  function printEqApoSettings(eqs, gain) {
    let typeMap = new Map([["PEAK", "PK"],["LOW_SHELF", "LSC"],["HIGH_SHELF", "HSC"]])  
    let formattedGain = String(gain).replace(",",".").replace("dB", "").trim();
    contentDiv.innerHTML = `Preamp: ${formattedGain} dB<br>`;
      eqs.forEach((eq, i) => {
        let num = (i+1+"").padStart(2);
        let type = typeMap.get(eq.type).padStart(3);
        let frequency = eq.frequency.padStart(8);
        let gain = eq.gain.replace(",",".").padStart(8);
        let q = eq.q.replace(",",".");

        contentDiv.innerHTML += `Filter ${num}: ON ${type} Fc ${frequency} Gain ${gain} Q ${q}<br>`;
      })
      
  }

  async function getContent(src) {
    const doc = await pdfjs.getDocument(src).promise;
    const page = await doc.getPage(1);
    return await page.getTextContent();
  }

  function assertEquals(actual, expected) {
    console.assert(
      actual == expected,
      "expected %s but was %s",
      expected,
      actual
    );
  }

//   extract("pdfs/Sennheiser HD650 (Optimum HiFi).pdf");

fileUpload.addEventListener("change", (event) => {
    let file = event.target.files[0]
    
    if (file) {
        filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension for use as base filename
    }

    // TODO probably check if we've got the right file

    reader.addEventListener('load', (event) => {
        extract(event.target.result);
    })
    reader.readAsDataURL(file);
})

dropArea.addEventListener("dragover", dragOverHandler, false);
dropArea.addEventListener("drop", dropHandler, false);
;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })
  
;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })

function highlight(e) {
    dropArea.classList.add('dragover')
  }
  
  function unhighlight(e) {
    dropArea.classList.remove('dragover')
  }

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
  }
  
  function dropHandler(ev) {
    console.log('File(s) dropped');
  
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    fileUpload.files = ev.dataTransfer.files;
    fileUpload.dispatchEvent(new Event('change'));

    
  
    

    // if (ev.dataTransfer.items) {
    //   // Use DataTransferItemList interface to access the file(s)
    //     // If dropped items aren't files, reject them
    //     if (ev.dataTransfer.items[0].kind === 'file') {
    //       var file = ev.dataTransfer.items[0].getAsFile();
    //       console.log('... file[' + 0 + '].name = ' + file.name);
    //       console.log(file);
    //     }
      
    // } else {
    //   // Use DataTransfer interface to access the file(s)
    //   for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    //     console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
    //   }
    // }
  }

  downloadBtn.addEventListener('click', function () {
    const content = document.getElementById('content').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

})(pdfjsLib);
