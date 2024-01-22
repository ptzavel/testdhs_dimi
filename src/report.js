const dayjs = require('dayjs')
const fs = require('fs')
const PdfPrinter = require('pdfmake')
require('dayjs/locale/el')

const fonts = {
  Roboto: {
    normal: '../fonts/Roboto/Roboto-Regular.ttf',
    bold: '../fonts/Roboto/Roboto-Bold.ttf',
    italics: '../fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: '../fonts/Roboto/Roboto-BoldItalic.ttf',
  },
}

const pdfStyles = {
  header: {
    fontSize: 16,
    bold: true,
    alignment: 'center',
    margin: [0, 50, 0, 20],
  },
  subheader: {
    fontSize: 12,
    italics: true,
    margin: [0, 10, 0, 10],
  },
  tableExample: {
    margin: [0, 10, 0, 20],
  },
  tableHeader: {
    fontSize: 13,
    color: 'black',
  },
}

export const doReport = async (reportData, language) => {
  if (language === 'gr') dayjs.locale('el')
  else dayjs.locale('en')
  let demographics = reportData[0]
  let vitalsHeaders = reportData[1]
  let vitalsDetails = reportData[2]
  vitalsDetails = vitalsDetails.reverse()
  let docDefinition = null

  let lastNMeasurements = vitalsHeaders?.length

  const charts = await createCharts(vitalsDetails, language)

  let testImageDataUrl = null
  let hasPicture = false
  if (demographics[0].picture) {
    hasPicture = true
    testImageDataUrl = 'data:image/png;base64,' + demographics[0].picture
  }

  docDefinition = {
    styles: pdfStyles,
    footer: function (currentPage, pageCount) {
      return {
        text: currentPage.toString() + ' / ' + pageCount,
        alignment: 'center',
        fontSize: 8,
        margin: [5, 5, 5, 5],
      }
    },
    watermark: { text: 'DHS Vitals', color: '#dcdcdc', opacity: 0.15, bold: true, italics: false },
    content: [...showDemographics(demographics, testImageDataUrl, lastNMeasurements, language)],
    pageBreakBefore: function (
      currentNode,
      followingNodesOnPage,
      nodesOnNextPage,
      previousNodesOnPage
    ) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0
    },
  }

  //wellnessLevel
  docDefinition.content.push(wellnessLevel(vitalsHeaders[0], language))

  let tb = createLastVitalsTable(vitalsHeaders[0], vitalsDetails, language)

  docDefinition.content.push({
    alignment: 'justify',
    style: 'tableExample',
    color: '#444',
    table: tb.table,
    layout: tableLayout,
  })

  docDefinition.content.push({
    image: `data:image/png;base64,${charts.pressureImage}`,
    width: 480,
  })

  docDefinition.content.push({
    image: `data:image/png;base64,${charts.heartRateImage}`,
    width: 480,
  })

  docDefinition.content.push({
    image: `data:image/png;base64,${charts.breathingRateImage}`,
    width: 480,
  })

  docDefinition.content.push({
    image: `data:image/png;base64,${charts.oxygenSaturationImage}`,
    width: 480,
  })
  // { heartRateImage: heartRateImageBase64, breathingRateImage: breathingRateImageBase64, pressureImage: pressureImageBase64 }

  /////////////////////
  //console.log(JSON.stringify(docDefinition, null, 2))
  //savePdfToDisk(docDefinition)
  const printer = new PdfPrinter(fonts)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  return pdfDoc
}

/*
  pdfDocGenerator.getBase64((data) => {
    alert(data);
  });
*/

const savePdfToDisk = async (docDefinition) => {
  const printer = new PdfPrinter(fonts)

  fs.exists('./chart.pdf', (exists) => {
    if (exists) {
      try {
        fs.unlinkSync('./chart.pdf')
        const pdfDoc = printer.createPdfKitDocument(docDefinition)
        pdfDoc.pipe(fs.createWriteStream('chart.pdf'))
        pdfDoc.end()
      } catch (err) {
        console.error(err)
      }
    } else {
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      pdfDoc.pipe(fs.createWriteStream('chart.pdf'))
      pdfDoc.end()
    }
  })
}

