const dayjs = require('dayjs')
const fs = require('fs')
const fs2 = require('fs').promises

const PdfPrinter = require('pdfmake')
require('dayjs/locale/el')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const colors = {
  HEARTRATE: 'rgb(13, 107, 200)',
  BREATHINGRATE: 'rgb(7, 166, 76)',
  SYSTOLIC: 'rgb(216, 35, 35)',
  DIASTOLIC: 'rgb(11, 35, 193)',
  OXYGEN: 'rgb(98, 22, 22)',
  TEXT: '#322d31',
}

const fonts = {
  Roboto: {
    normal: './fonts/Roboto/Roboto-Regular.ttf',
    bold: './fonts/Roboto/Roboto-Bold.ttf',
    italics: './fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: './fonts/Roboto/Roboto-BoldItalic.ttf',
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
  contentBold: {
    fontSize: 10,
    bold: true,
    margin: [0, 5, 0, 5],
  },
  content: {
    fontSize: 10,
    margin: [0, 5, 0, 5],
  },
  tableExample: {
    margin: [0, 10, 0, 20],
  },
  tableHeader: {
    fontSize: 13,
    color: 'black',
  },
}
const atob = (base64) => Buffer.from(base64, 'base64').toString('binary')

const writeBas64AsPdf = async (contents, outFilePath, callback) => {
  var bin = atob(contents)
  await fs2.writeFile(outFilePath, bin, 'binary')
}

const doReport = async (OUT_PATH, fileName, reportData, vatNumber, callback) => {
  dayjs.locale('el')
  let title = reportData[0]
  let header = reportData[1]
  let citizen = reportData[2]
  let form = reportData[3]

  let docDefinition = null

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
    //watermark: { text: 'DHS Vitals', color: '#dcdcdc', opacity: 0.15, bold: true, italics: false },
    content: [...showTitle(title)],
    pageBreakBefore: function (
      currentNode,
      followingNodesOnPage,
      nodesOnNextPage,
      previousNodesOnPage
    ) {
      return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0
    },
  }
  docDefinition.content.push(...horizontalLine())
  docDefinition.content.push(...showHeader(header))
  docDefinition.content.push(...horizontalLine())
  docDefinition.content.push(...showCitizen(citizen))
  docDefinition.content.push(...horizontalLine())
  docDefinition.content.push(...showForm(form))

  const printer = new PdfPrinter(fonts)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)

  //let writeStream = fs.createWriteStream('./pdfs/' + fileName)
  let writeStream = fs.createWriteStream(OUT_PATH + '/' + fileName)

  pdfDoc.pipe(writeStream)
  pdfDoc.end()

  let contents = ''
  writeStream.on('close', async function () {
    // contents = await fs2.readFile(path.resolve(__dirname, '../pdfs/' + fileName), {
    //   encoding: 'base64',
    // })
    contents = await fs2.readFile(OUT_PATH + '/' + fileName, {
      encoding: 'base64',
    })

    //await writeBas64AsPdf(contents, path.resolve(__dirname, '../pdfs/' + 'outfile.pdf'))
    //await fs2.unlink(path.resolve(__dirname, '../pdfs/' + fileName))
    //  await fs2.unlink(path.resolve(OUT_PATH + '/' + fileName))

    callback(contents)
  })

  return contents
}

const horizontalLine = () => {
  return [
    {
      table: {
        headerRows: 0,
        widths: ['100%'],
        body: [[''], ['']],
      },
      layout: 'lightHorizontalLines',
    },
  ]
}

const showTitle = (title) => {
  return [
    {
      alignment: 'center',
      columns: [
        {
          text: title[0].contents,
          style: 'header',
          color: colors.TEXT,
        },
      ],
    },
  ]
}

const showHeader = (header) => {
  return [
    {
      alignment: 'left',
      columns: [
        {
          text: header[0].title + ':  ',
          style: 'contentBold',
          color: colors.TEXT,
        },
        {
          text: header[0].contents,
          style: 'content',
          color: colors.TEXT,
        },
        {
          text: header[1].title + ':  ',
          style: 'contentBold',
          color: colors.TEXT,
        },
        {
          text: header[1].contents,
          style: 'content',
          color: colors.TEXT,
        },
      ],
    },
  ]
}

const showCitizen = (citizen) => {
  let out = []

  let ok = true
  let i = 0
  while (ok) {
    out.push({
      alignment: 'left',
      columns: [
        {
          text: citizen[i]?.title + (citizen[i]?.title ? ':  ' : ''),
          style: 'contentBold',
          color: colors.TEXT,
        },
        {
          text: citizen[i]?.contents,
          style: 'content',
          color: colors.TEXT,
        },
        {
          text: citizen[i + 1]?.title || '' + (citizen[i + 1]?.title ? ':  ' : ''),
          style: 'contentBold',
          color: colors.TEXT,
        },
        {
          text: citizen[i + 1]?.contents || '',
          style: 'content',
          color: colors.TEXT,
        },
      ],
    })
    i = i + 2
    if (i >= citizen.length) {
      ok = false
    }
  }

  return out
}

const showForm = (form) => {
  let out = []

  let ok = true
  let i = 0
  while (ok) {
    out.push({
      alignment: 'left',
      columns: [
        {
          text: form[i]?.title + (form[i]?.title ? ':  ' : ''),
          style: 'contentBold',
          color: colors.TEXT,
        }
      ],
    })

    out.push({
      alignment: 'left',
      columns: [
        {
          text: form[i]?.contents,
          style: 'content',
          color: colors.TEXT,
        },
      ],
    })


    i = i + 1
    if (i >= form.length) {
      ok = false
    }
  }

  return out
}

const savePdfToDisk = async (docDefinition) => {
  const printer = new PdfPrinter(fonts)

  fs.exists('./application.pdf', (exists) => {
    if (exists) {
      try {
        fs.unlinkSync('./application.pdf')
        const pdfDoc = printer.createPdfKitDocument(docDefinition)
        pdfDoc.pipe(fs.createWriteStream('application.pdf'))
        pdfDoc.end()
      } catch (err) {
        console.error(err)
      }
    } else {
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      pdfDoc.pipe(fs.createWriteStream('application.pdf'))
      pdfDoc.end()
    }
  })
}

module.exports = doReport
