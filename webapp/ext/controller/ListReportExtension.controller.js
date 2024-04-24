sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageItem",
    "sap/m/MessageView",
    "sap/m/MessageBox",
    'sap/ui/core/library',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Bar',
    'sap/m/Title',
    'sap/ui/core/IconPool',
    "sap/m/MessageToast"
],
    function (Controller, Fragment, JSONModel, MessageItem, MessageView, MessageBox, coreLibrary, Dialog, Button, Bar, Title, IconPool, MessageToast) {
        "use strict";
        return {
            inputAmountDialog: null,
            reviewDialog: null,
            reviewTamUngDialog: null,
            inputHeaderDialog: null,
            busyDialog: null,
            deNghiData: null,
            openBusyDialog: function () {
                if (!this.busyDialog) {
                    Fragment.load({
                        id: "busyFragment",
                        name: "zdenghi.ext.fragment.Busy",
                        type: "XML",
                        controller: this
                    })
                        .then((oDialog) => {
                            this.busyDialog = oDialog;
                            this.busyDialog.open()
                        })
                        .catch(error => {
                            MessageBox.error('Vui lòng tải lại trang')
                        });
                } else {
                    this.busyDialog.open()
                }
            },
            onInitSmartFilterBarExtension: function(oEvent) {
                let filterObject = this.getView().byId('listReportFilter')
                let defaultValue = {
                    CompanyCode : '1000'
                }
                filterObject.setFilterData(defaultValue)
            },
            onPrintDeNghi: function (oEvent) {
                this.inputHeaderDialog.close()
                this.openBusyDialog()
                var component = this.getOwnerComponent();
                let thatController = this
                let oSelectedContext = this.extensionAPI.getSelectedContexts();
                let selectDocument = []
                oSelectedContext.forEach(element => {
                    selectDocument.push(thatController.readDocumentData(element))
                })
                Promise.all(selectDocument)
                    .then((value) => {
                        const d = new Date()
                        let rawData = thatController.getRawDataPhieuDeNghi(value)
                        let xmlDatas = ''
                        rawData.item.forEach((item, index) => {
                            xmlDatas = xmlDatas + `
                        <Data>
                        <STT>${item.STT}</STT>
                        <SoHoaDon>${item.SoHoaDon}</SoHoaDon>
                        <NgayHoaDon>${item.NgayHoaDon}</NgayHoaDon>
                        <DienGiai>${item.DienGiai}</DienGiai>
                        <sotientruocthue>${item.sotientruocthue}</sotientruocthue>
                        <VAT>${item.VAT}</VAT>
                        <sotiendenghi>${item.sotiendenghi}</sotiendenghi>
                        </Data>
                        `
                        })
                        let xmlDataRaw =
                            `<?xml version="1.0" encoding="UTF-8"?>
                    <form1>
                       <MAIN>
                          <Heading>
                             <companyCodeName>${rawData.companyCodeName}</companyCodeName>
                             <companyCodeAdress>${rawData.companyCodeAdress}</companyCodeAdress>
                             <Tel_Fax>
                                <companyCodePhone>Tel:${rawData.companyCodePhone}</companyCodePhone>
                                <companyCodeFax>Fax:${rawData.companyCodeFax}</companyCodeFax>
                             </Tel_Fax>
                             <Email_Web>
                                <companyCodeEmail>Email: ${rawData.companyCodeEmail}</companyCodeEmail>
                                <companyCodeWeb><![CDATA[Website:${rawData.companyCodeWeb}]]></companyCodeWeb>
                             </Email_Web>
                          </Heading>
                       </MAIN>
                       <title>${rawData.title}</title>
                       <kinhGui/>
                       <HeaderInfo>
                          <So>2000012</So>
                          <ToiTen>${rawData.ToiTen}</ToiTen>
                          <DonViCongTac>${rawData.DonViCongTac}</DonViCongTac>
                          <LyDoThanhToan>${rawData.LyDoThanhToan}</LyDoThanhToan>
                       </HeaderInfo>
                       <DataSubForm>
                          <DataTable>
                             <HeaderRow/>
                             ${xmlDatas}
                             <Sum>
                                <SumTongCong>${rawData.SumTongCong}</SumTongCong>
                             </Sum>
                          </DataTable>
                       </DataSubForm>
                       <FooterInfomation>
                          <SoTienBangChu>Ba muoi ba trieu VND</SoTienBangChu>
                          <ChungTuKemTheo>${rawData.ChungTuKemTheo}</ChungTuKemTheo>
                          <HinhThucThanhToan>${rawData.HinhThucThanhToan}</HinhThucThanhToan>
                          <NguoiThuHuong>${rawData.NguoiThuHuong}</NguoiThuHuong>
                          <NganHangThuHuong>${rawData.NganHangThuHuong}</NganHangThuHuong>
                          <SoTaiKhoan>${rawData.SoTaiKhoan}</SoTaiKhoan>
                       </FooterInfomation>
                       <Sign>
                       <NgayThangNam>${getFormatDate(d,2)}</NgayThangNam>
                       </Sign>
                    </form1>`
                    console.log("alo")
                    console.log(getFormatDate(d,2))
                        let xmlDataBase64 = window.btoa(unescape(encodeURIComponent(xmlDataRaw)))
                        let request = JSON.stringify({
                            "id": `1`,
                            "report": "DNTT",
                            "xdpTemplate": "DENGHI/DENGHI",
                            "zxmlData": xmlDataBase64,
                            "formType": "interactive",
                            "formLocale": "en_US",
                            "taggedPdf": 1,
                            "embedFont": 1,
                            "changeNotAllowed": false,
                            "printNotAllowed": false
                        });
                        var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/z_api_adobe?=";
                        $.ajax({
                            url: url_render,
                            type: "POST",
                            contentType: "application/json",
                            data: request,
                            success: function (response, textStatus, jqXHR) {

                                let data = JSON.parse(response)
                                if (data.fileContent) {
                                    var decodedPdfContent = atob(data.fileContent)//base65 to string ?? to pdf
                                    var byteArray = new Uint8Array(decodedPdfContent.length);
                                    for (var i = 0; i < decodedPdfContent.length; i++) {
                                        byteArray[i] = decodedPdfContent.charCodeAt(i);
                                    }
                                    var blob = new Blob([byteArray.buffer], {
                                        type: 'application/pdf'
                                    });
                                    var _pdfurl = URL.createObjectURL(blob);
                                    if (!thatController._PDFViewer) {
                                        thatController._PDFViewer = new sap.m.PDFViewer({
                                            width: "auto",
                                            source: _pdfurl,
                                        });
                                        jQuery.sap.addUrlWhitelist("blob");
                                    }
                                    thatController._PDFViewer.downloadPDF();
                                }

                                thatController.busyDialog.close();
                            },
                            error: function (data) {
                                thatController.busyDialog.close();
                                MessageBox.error(`Đã có lỗi xảy ra. ${error.message}`)
                                console.log('message Error' + JSON.stringify(data));
                            }
                        });

                    })
                    .catch((error) => {
                        MessageBox.error(`Đã có lỗi xảy ra. ${error.message}`)
                        console.log(error)
                    })
            },
            onCloseInputHeader: function (oEvent) {
                this.inputHeaderDialog.close()
            },
            readDocumentData: function (element) {
                return new Promise((resolve, reject) => {
                    let oModel = element.getModel()
                    // let listItem = []
                    oModel.read(element.getPath(), {
                        success: function (oData, oResponse) {
                            console.log(oModel)
                            oModel.read(`${element.getPath()}/to_BusinessPartnerBank`, {
                                success: function (oDataBanks) {
                                    if (oDataBanks.results && oDataBanks.results.length !== 0){
                                        oData.banks = []
                                        oDataBanks.results.forEach((bank)=>{
                                            oData.banks.push({
                                                BankIdentification : bank.BankIdentification,
                                                BankName : bank.BankName,
                                                BankNumber : bank.BankNumber,
                                                BankAccount : bank.BankAccount,
                                                BankAccountHolderName : bank.BankAccountHolderName
                                            })
                                        })
                                    }
                                    resolve(oData)
                                },
                                error: function(error){
                                    reject(oData)
                                }
                            })
                            
                        },
                        error: function (error) {
                            reject(error)
                        }
                    })
                })
            },
            getRawDataPhieuDeNghi: function (value) {
                function getFormatDate(dateFormat,so) {
                    var date = dateFormat.getDate() < 10 ? `0${dateFormat.getDate()
                       }` : dateFormat.getDate();
                    var month = dateFormat.getMonth() + 1 < 10 ? `0${dateFormat.getMonth() + 1
                       }` : dateFormat.getMonth() + 1;
                    var year = dateFormat.getFullYear();
                    if(so == 1){
                       var dateDone = `${date}/${month}/${year}`;
                       return dateDone;
                    }
                    else{
                       var dateDone = `Ngày ${date} tháng ${month} năm ${year}`;
                       return dateDone;
                    }
        
                 }
                let rawData = {}
                if (value.length && value.length > 0) {
                    let rawDataItem = []
                    const VND = new Intl.NumberFormat('en-DE');
                    let SumTongCong = 0;
                    const d = new Date();
                    let NgayThangNam =getFormatDate(d,2)
                    console.log(NgayThangNam)
                    value.forEach((item, index) => {
                        rawDataItem.push({
                            stt: index + 1,
                            sohoadon: item.DocumentReferenceID,
                            ngayhoadon: `${String(item.DocumentDate.getDate()).padStart(2, '0') }/${String(item.DocumentDate.getMonth() + 1).padStart(2, '0')}/${item.DocumentDate.getFullYear()}`,
                            diengiai: item.DienGiai,
                            transactioncurrency: item.TransactionCurrency,
                            
                            sotientruocthueUi: VND.format(item.soTienTruocThue),
                            sotientruocthue: item.soTienTruocThue,

                            vatUi: VND.format(item.VAT),
                            vat: item.VAT,

                            sotiendenghiUi: VND.format(item.soTienDeNghi),
                            sotiendenghi: item.soTienDeNghi,

                            // sotientamungUi: VND.format(item.soTienTamUng),
                            // sotientamung: item.sotientamung,
                            // thoihantamung: `${String(item.DueCalculationBaseDate.getDate()).padStart(2, '0')}/${item.DueCalculationBaseDate.getMonth() + 1}/${item.DueCalculationBaseDate.getFullYear()}`,

                            accountingdocument: item.AccountingDocument,
                            accountingdocumentyear: item.FiscalYear,
                            accountingcompanycode: item.CompanyCode,
                            customer: item.Customer,
                            supplier: item.Supplier,
                            statuscritical: item.StatusCritical
                        })
                        SumTongCong += Number(item.soTienDeNghi);
                    })
                    rawData = {
                        account: value[0].Account,
                        nguoinhan: value[0].AccountName,
                        AccountName: value[0].AccountName,
                        // BankName: value[0].BankName,
                        // BankAccount: value[0].BankAccount,
                        // BankAccountHolderName: value[0].BankAccountHolderName,
                        partnerBankTypeVisible : false,
                        paymentmethod: "Tiền mặt",
                        companycode: value[0].CompanyCode,
                        companyCodeName: value[0].CompanyCodeName,
                        companyCodeNameUI: `<strong>${value[0].CompanyCodeName}</strong>`,
                        nguoidenghi: sap.ushell.Container.getService("UserInfo").getFullName(),
                        companyCodeAdress: value[0].CompanyCodeAddress,
                        companyCodeAdressUI: `<strong>${value[0].CompanyCodeAddress}</strong>`,

                        companyCodePhone: value[0].CompanyCodePhoneNumber,
                        companyCodePhoneUI: `<strong>Telephone: </strong>${value[0].CompanyCodePhoneNumber}`,

                        companyCodeFax: value[0].CompanyCodeFax,
                        companyCodeFaxUI: `<strong>Fax: </strong>${value[0].CompanyCodeFax}`,

                        companyCodeEmail: value[0].CompanyCodeEmailAddress,
                        companyCodeEmailUI: `<strong>Email: </strong>${value[0].CompanyCodeEmailAddress}`,

                        companyCodeWeb: value[0].CompanyCodeWebsite,
                        companyCodeWebUI: `<strong>Website: </strong>${value[0].CompanyCodeWebsite}`,

                        title: value[0].p_ctu == 'A' ? "GIẤY ĐỀ NGHỊ THANH TOÁN" : "GIẤY ĐỀ NGHỊ TẠM ỨNG",
                        ctdenghi: value[0].p_ctu,
                        sumTongCong: VND.format(SumTongCong),
                        sumTongCongBF: SumTongCong,
                        items: rawDataItem,
                        banks: value[0].banks,
                        ngaythangnam : NgayThangNam,
                        sotienCT : SumTongCong
                    }
                }
                return rawData
            },
            getRawDataTamUng: function (value) {
                
                console.log(URLSearchParams)
                let rawData = {}
                const VND = new Intl.NumberFormat('en-DE');
                rawData = {
                    account: value[0].Account,
                    nguoinhan: value[0].AccountName,
                    AccountName: value[0].AccountName,
                    //
                    // BankName: value[0].BankName,
                    // BankAccount: value[0].BankAccount,
                    // BankAccountHolderName: value[0].BankAccountHolderName,
                    //
                    partnerBankTypeVisible : false,
                    paymentmethod: "Tiền mặt",
                    companycode: value[0].CompanyCode,
                    companyCodeName: value[0].CompanyCodeName,
                    companyCodeNameUI: `<strong>${value[0].CompanyCodeName}</strong>`,

                    companyCodeAdress: value[0].CompanyCodeAddress,
                    companyCodeAdressUI: `<strong>${value[0].CompanyCodeAddress}</strong>`,

                    companyCodePhone: value[0].CompanyCodePhoneNumber,
                    companyCodePhoneUI: `<strong>Telephone: </strong>${value[0].CompanyCodePhoneNumber}`,

                    companyCodeFax: value[0].CompanyCodeFax,
                    companyCodeFaxUI: `<strong>Fax: </strong>${value[0].CompanyCodeFax}`,

                    companyCodeEmail: value[0].CompanyCodeEmailAddress,
                    companyCodeEmailUI: `<strong>Email: </strong>${value[0].CompanyCodeEmailAddress}`,

                    companyCodeWeb: value[0].CompanyCodeWebsite,
                    companyCodeWebUI: `<strong>Website: </strong>${value[0].CompanyCodeWebsite}`,

                    title: value[0].p_ctu == 'A' ? "GIẤY ĐỀ NGHỊ THANH TOÁN" : "GIẤY ĐỀ NGHỊ TẠM ỨNG",
                    ctdenghi: value[0].p_ctu,
                    transactioncurrency: value[0].TransactionCurrency,

                    sotientamungUi: VND.format(value[0].soTienTamUng),
                    sotientamung: value[0].soTienTamUng,
                    soducongno: value[0].soDuCongNoTamUng,
                    soducongnoUi: VND.format(value[0].soDuCongNoTamUng),

                    thoihantamung: `${String(value[0].DueCalculationBaseDate.getDate()).padStart(2, '0')}/${String(value[0].DueCalculationBaseDate.getMonth() + 1).padStart(2, '0')}/${value[0].DueCalculationBaseDate.getFullYear()}`,

                    accountingdocument: value[0].AccountingDocument,
                    accountingdocumentyear: value[0].FiscalYear,
                    accountingcompanycode: value[0].CompanyCode,
                    supplier: value[0].Supplier,
                    statuscritical: value[0].StatusCritical,
                    banks: value[0].banks
                }
                return rawData
            },
            onActionCreateDeNghi: function (oEvent) {
                let thatController = this
                let oSelectedContext = this.extensionAPI.getSelectedContexts();
                let selectDocument = []
                oSelectedContext.forEach(element => {
                    selectDocument.push(thatController.readDocumentData(element))
                })
                var filterObject = this.getView().byId("listReportFilter").getFilterData()
                if (filterObject['$Parameter.p_ctu'] == 'A') {
                    // Xử lý đề nghị thanh toán
                    this.openBusyDialog()
                    Promise.all(selectDocument)
                        .then((value) => {
                            let rawData = thatController.getRawDataPhieuDeNghi(value)
                            let is_value = true
                            console.log(value)
                            rawData.items.forEach((element) => {
                                if (element.statuscritical == 3) {
                                    MessageBox.error(`Chứng từ ${element.accountingdocument} đã post đề nghị hoàn tất.`)
                                    is_value = false
                                }
                            })

                            if (is_value) {
                                console.log(rawData)
                                let oModel = new JSONModel(rawData);
                                if (!thatController.reviewDialog) {
                                    Fragment.load({
                                        id: "reviewFragment",
                                        name: "zdenghi.ext.fragment.ReviewDeNghi",
                                        type: "XML",
                                        controller: thatController
                                    })
                                        .then((oDialog) => {
                                            thatController.reviewDialog = oDialog;
                                            thatController.reviewDialog.setModel(oModel, "ReviewData")
                                            thatController.reviewDialog.open()
                                            thatController.busyDialog.close()
                                        })
                                        .catch(error => {
                                            MessageBox.error('Vui lòng tải lại trang')
                                        });
                                } else {
                                    thatController.reviewDialog.setModel(oModel, "ReviewData")
                                    thatController.reviewDialog.open()
                                    thatController.busyDialog.close()
                                }
                            }
                            else {
                                thatController.busyDialog.close()
                            }
                        })
                        .catch((error) => {
                            MessageBox.error(`Đã có lỗi xảy ra. ${error.message}`)
                            thatController.busyDialog.close()

                        })
                } else if (filterObject['$Parameter.p_ctu'] == 'B') {
                    if (selectDocument.length > 1) {
                        MessageBox.error('Chỉ chọn 1 chứng từ để tạo đề nghị tạm ứng')
                        thatController.busyDialog.close()
                        return
                    }
                    this.openBusyDialog()
                    // Xử lý đề nghị tạm ứng
                    Promise.all(selectDocument)
                        .then((value) => {
                            let rawData = thatController.getRawDataTamUng(value)
                            let is_value = true
                            if (is_value) {
                                let oModel = new JSONModel(rawData);
                                if (!thatController.reviewTamUngDialog) {
                                    Fragment.load({
                                        id: "reviewtTamUngFragment",
                                        name: "zdenghi.ext.fragment.ReviewDeNghiTamUng",
                                        type: "XML",
                                        controller: thatController
                                    })
                                        .then((oDialog) => {
                                            thatController.reviewTamUngDialog = oDialog;
                                            thatController.reviewTamUngDialog.setModel(oModel, "ReviewData")
                                            thatController.reviewTamUngDialog.open()
                                            thatController.busyDialog.close()
                                        })
                                        .catch(error => {
                                            MessageBox.error('Vui lòng tải lại trang')
                                        });
                                } else {
                                    thatController.reviewTamUngDialog.setModel(oModel, "ReviewData")
                                    thatController.reviewTamUngDialog.open()
                                    thatController.busyDialog.close()
                                }
                                console.log(rawData)
                            }
                            else {
                                thatController.busyDialog.close()
                            }
                        })
                        .catch((error) => {
                            console.error(JSON.stringify(error))
                            MessageBox.error(`Đã có lỗi xảy ra ${JSON.stringify(error)}`)
                            thatController.busyDialog.close()
                        })
                }
            },
            onPostTamUngFromReviewTamUngDialog: function (oEvent) {
                this.openBusyDialog()
                var thatController = this
                let dataRequest = this.reviewTamUngDialog.getModel("ReviewData").getJSON()
                let dataJSON = JSON.parse(dataRequest)
                console.log(dataRequest)
                if (!dataJSON.paymentmethod || dataJSON.paymentmethod == '') {
                    MessageBox.error("Vui lòng điền Hình thức thanh toán")
                    this.busyDialog.close()
                    return
                }
                // if(dataRequest.)
                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZFI_API_DENGHI?=";
                $.ajax({
                    url: url_render,
                    type: "POST",
                    contentType: "application/json",
                    data: dataRequest,
                    success: function (response, textStatus, jqXHR) {

                        let dataResponse = JSON.parse(response)
                        if (dataResponse.pdf) {
                            var decodedPdfContent = atob(dataResponse.pdf)//base65 to string ?? to pdf
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);
                            if (!this._PDFViewer) {
                                this._PDFViewer = new sap.m.PDFViewer({
                                    width: "auto",
                                    source: _pdfurl,
                                });
                                jQuery.sap.addUrlWhitelist("blob");
                            }
                            this._PDFViewer.downloadPDF();
                        }
                        thatController.busyDialog.close();
                        thatController.reviewTamUngDialog.close();
                        thatController.getView().getModel().refresh();
                    },
                    error: function (error) {
                        thatController.busyDialog.close();
                        MessageBox.error(`Error exists ${JSON.stringify(error)}`)
                    }
                });                
            },
            onPostDeNghiFromReviewDialog: function (oEvent) {
                this.openBusyDialog()
                var thatController = this
                let oModel = oEvent.getSource()

                let dataRequest = this.reviewDialog.getModel("ReviewData").getJSON()
                let dataJSON = JSON.parse(dataRequest)
                console.log(dataJSON)
                console.log(Number(dataJSON.sotienCT) )
                console.log( Number(dataJSON.sumTongCongBF))
                if (!dataJSON.paymentmethod || dataJSON.paymentmethod == '') {
                    thatController.busyDialog.close()
                    MessageBox.error("Vui lòng điền Hình thức thanh toán")
                    this.busyDialog.close()
                    return
                }
                else if(Number(dataJSON.sotienCT) < Number(dataJSON.sumTongCongBF)){
                    thatController.busyDialog.close()
                    console.log("Đã vào if sum")
                    MessageBox.error("Số tiền in Đề nghị thanh toán vượt quá số tiền trên hoá đơn")
                    this.busyDialog.close()
                    return 
                }
                console.log(dataRequest)
                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZFI_API_DENGHI?=";
                $.ajax({
                    url: url_render,
                    type: "POST",
                    contentType: "application/json",
                    data: dataRequest,
                    success: function (response, textStatus, jqXHR) {

                        let dataResponse = JSON.parse(response)
                        if (dataResponse.pdf) {
                            var decodedPdfContent = atob(dataResponse.pdf)//base65 to string ?? to pdf
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);
                            if (!this._PDFViewer) {
                                this._PDFViewer = new sap.m.PDFViewer({
                                    width: "auto",
                                    source: _pdfurl,
                                });
                                jQuery.sap.addUrlWhitelist("blob");
                            }
                            this._PDFViewer.downloadPDF();
                        }
                        thatController.busyDialog.close();
                        thatController.reviewDialog.close();
                        thatController.getView().getModel().refresh();
                    },
                    error: function (error) {
                        thatController.busyDialog.close();
                        MessageBox.error(`Error exists ${JSON.stringify(error)}`)
                    }
                });
            },
            onCloseReviewDialog: function (oEvent) {
                this.reviewDialog.close()
            },
            onCloseReviewTamUngDialog: function(oEvent){
                this.reviewTamUngDialog.close()
            },
            onChangeTongCong: function (oEvent) {
                // MessageToast.show("Details for product with id " + this.getView().getModel());
                const VND = new Intl.NumberFormat('en-DE');

                let data = oEvent.getSource().getParent().getRowBindingContext().getObject()

                let VATFloat = 0
                if (data.vat) {
                    VATFloat = parseFloat(data.vat)
                }
                data.vatUi = VND.format(data.vat)

                let newTriGiaFloat = 0
                if (data.sotientruocthue) {
                    newTriGiaFloat = parseFloat(data.sotientruocthue)
                }
                data.sotientruocthueUi = VND.format(data.sotientruocthue)

                let newTongCong = newTriGiaFloat + VATFloat
                data.sotiendenghiUi = VND.format(newTongCong)
                data.sotiendenghi = newTongCong

                let newSumTongCong = 0
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()

                reviewData.items.forEach((value) => {
                    newSumTongCong = parseFloat(newSumTongCong) + parseFloat(value.sotiendenghi)
                })
                reviewData.sumTongCong = VND.format(newSumTongCong)
                reviewData.sumTongCongBF = newSumTongCong

            },
            onChangePaymentMeth: function (oEvent) {
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()
                console.log(reviewData)
                if (reviewData.paymentmethod == 'Chuyển khoản') {
                    reviewData.nguoinhan = `${reviewData.banks[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.partnerBankType = `${reviewData.banks[0].BankIdentification}`
                    reviewData.tennganhang = `${reviewData.banks[0].BankName}`
                    reviewData.sotaikhoannhan = `${reviewData.banks[0].BankAccount}`
                    reviewData.partnerBankTypeVisible = true
                } else if (reviewData.paymentmethod == 'Tiền mặt' || reviewData.paymentmethod == 'Phương thức khác') {
                    reviewData.nguoinhan = `${reviewData.AccountName}`
                    reviewData.tennganhang = ''
                    reviewData.sotaikhoannhan = ''
                    reviewData.partnerBankTypeVisible = false
                }

            },
            onChangePaymentMethTamUng: function (oEvent){
                let reviewData = this.reviewTamUngDialog.getModel("ReviewData").getData()
                console.log(reviewData)
                if (reviewData.paymentmethod == 'Chuyển khoản') {
                    reviewData.nguoinhan = `${reviewData.banks[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.partnerBankType = `${reviewData.banks[0].BankIdentification}`
                    reviewData.tennganhang = `${reviewData.banks[0].BankName}`
                    reviewData.sotaikhoannhan = `${reviewData.banks[0].BankAccount}`
                    reviewData.partnerBankTypeVisible = true
                } else if (reviewData.paymentmethod == 'Tiền mặt' || reviewData.paymentmethod == 'Phương thức khác') {
                    reviewData.nguoinhan = `${reviewData.AccountName}`
                    reviewData.tennganhang = ''
                    reviewData.sotaikhoannhan = ''
                    reviewData.partnerBankTypeVisible = false
                }
            },
            onChangePartnerBankType:function (oEvent) {
                let reviewData = this.reviewDialog.getModel("ReviewData").getData()
                if (reviewData.partnerBankType) {
                    let chosenBank = reviewData.banks.filter(obj => {
                        return obj.BankIdentification === reviewData.partnerBankType;
                    });
                    reviewData.nguoinhan = `${chosenBank[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.tennganhang = `${chosenBank[0].BankName}`
                    reviewData.sotaikhoannhan = `${chosenBank[0].BankAccount}`
                }
            },
            onChangePartnerBankTypeTamUng:function (oEvent) {
                let reviewData = this.reviewTamUngDialog.getModel("ReviewData").getData()
                if (reviewData.partnerBankType) {
                    let chosenBank = reviewData.banks.filter(obj => {
                        return obj.BankIdentification === reviewData.partnerBankType;
                    });
                    reviewData.nguoinhan = `${chosenBank[0].BankAccountHolderName}`
                    if (reviewData.nguoinhan == '') {
                        reviewData.nguoinhan = `${reviewData.AccountName}`
                    }
                    reviewData.tennganhang = `${chosenBank[0].BankName}`
                    reviewData.sotaikhoannhan = `${chosenBank[0].BankAccount}`
                }
            }
        }
    }
)
