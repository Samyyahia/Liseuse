import * as pdfLib from  'pdfjs-dist/build/pdf'

(function (pdfLib) {
    let app = {
        page: 0,
        pageMode: 2,
        cursorIndex: Math.floor(0),
        pdf: null,
        pages: 0,
        next: null,
        prev: null,
        init: function () {
            pdfLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.4.456/build/pdf.worker.min.js'

            window.initPDFViewer = (url, config) => {
                let loader = pdfLib.getDocument(url)

                if (config.container)
                    this.container = document.querySelector(config.container)

                if (config.pageMode)
                    this.pageMode = parseInt(config.pageMode)

                if (config.next)
                    this.next = document.querySelector(config.next)

                if (config.prev)
                    this.prev = document.querySelector(config.prev)

                loader.promise.then(pdf => {
                    this.pdf = pdf
                    this.pages = pdf.numPages

                    this.initPager()
                    this.render()
                })


                if (config.breakpoints) {
                    const handleResize = () => {
                        const bps = config.breakpoints
                        const keys = Object.keys(config.breakpoints)

                        let bp

                        keys.forEach((k) => {
                            if (window.innerWidth <= parseInt(k))
                                bp = bps[k]
                            else
                                bp = config
                        })

                        if (bp.pageMode !== this.pageMode) {
                            this.pageMode = bp.pageMode

                            this.page = 0;
                            this.render()
                        }
                    }

                    handleResize()
                    window.addEventListener('resize', () => handleResize())
                }
            }
        },

        // INIT FUNC*
        initPager: function () {
            if (this.next)
                this.next.addEventListener('click', (e) => this.handleClick(e, true))

            if (this.prev)
                this.prev.addEventListener('click', (e) => this.handleClick(e, false))
        },

        // EVENT METHODS

        handleClick: function (e, dir = false) {
            if (!dir) {
                if (this.page === 0)
                    return

                this.page -= this.pageMode

                if (this.page < 0)
                    this.page = 0;

                this.render()
            } else {
                if (this.page === this.pages - 1)
                    return

                this.page += this.pageMode

                if (this.page > this.pages - 1)
                    this.page = this.pages - 1;

                this.render()
            }
        },

        // RENDER
        render: function () {
            const viewport = this.container;

            this.cursorIndex = Math.floor(this.page / this.pageMode)

            const start = this.cursorIndex * this.pageMode
            const end = start + this.pageMode < this.pages ? start + this.pageMode - 1 : this.pages - 1

            const promises = []

            for (let i = start; i <= end; i++) {
                promises.push(this.pdf.getPage(i + 1))
            }

            Promise.all(promises).then(pages => {
                const html = `<div style="width: ${this.pageMode > 1 ? "50%" : "100%"}"><canvas></canvas></div>`.repeat(pages.length)

                viewport.innerHTML = html

                pages.forEach((page) => this.renderPage(page))
            })
        },

        renderPage: function (page) {
            const viewport = this.container;

            let pdfViewport = page.getViewport({ scale: 1 });

            const container = viewport.children[page._pageIndex - this.cursorIndex * this.pageMode];

            pdfViewport = page.getViewport({ scale: container.offsetHeight / pdfViewport.height });

            const canvas = container.children[0];
            const context = canvas.getContext("2d");

            canvas.height = pdfViewport.height;
            canvas.width = pdfViewport.width;

            page.render({
                canvasContext: context,
                viewport: pdfViewport
            });
        }
    }

    app.init()
})(pdfLib)

