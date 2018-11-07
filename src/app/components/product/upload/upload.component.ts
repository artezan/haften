import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { TokenJwtService } from 'src/app/services/token-jwt.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  nameFile = '';
  typeFile: string;
  isLogin = false;
  token;
  constructor(
    private tokenService: TokenJwtService,
    private productService: ProductService
  ) {}

  ngOnInit() {}
  getToken(user: string, password: string) {
    this.tokenService.getTokenJWT(user, password).subscribe(data => {
      this.token = data.token;
      this.isLogin = true;
    });
  }
  postProduct(data: any[]) {
    this.productService
      .postProducts(data, this.token)
      .subscribe(res => console.log(res));
  }
  link() {
    const input = document.getElementById('file1').click();
  }
  fileChangeEvent(event): void {
    console.log('event', event);
    // const file = event.target.files[0];
    const name: string = event.target.files.item(0).name;
    const typeFile: string = name.substring(name.indexOf('.') + 1);
    this.typeFile = typeFile;
    this.excelFile(event);
  }
  // Excel a JSON
  private excelFile(evt: any): void {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      // pasar de excel a json
      const dataExcelJson = this.exelToJson(wb);
      console.log(dataExcelJson);
      this.nameFile = dataExcelJson[0].name;
      const products = this.transformData(dataExcelJson[0].data);
      console.log('products', products);

      // subir datos
      this.postProduct(products);
    };
    reader.readAsBinaryString(target.files[0]);
  }
  private exelToJson(wb: XLSX.WorkBook): Array<{ data: any[]; name: string }> {
    const arrJson = [];
    let columsNames: string[];
    wb.SheetNames.forEach(sheetName => {
      const arrRows = [];
      // doc https://github.com/SheetJS/js-xlsx#utility-functions
      const dataRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header: 1,
        defval: ''
      });
      console.log('dataRows', dataRows);
      dataRows.forEach((row: Array<any>, numRow) => {
        const obj = {};
        // caputa nombre de colums
        if (numRow === 0) {
          columsNames = row;
        } else {
          // crea un obj con nomColumna: dato
          columsNames.forEach((nameColum, numColum) => {
            obj[
              nameColum
                .toLocaleLowerCase()
                .trim()
                .split(' ')
                .join('_')
            ] = row[numColum];
            if (!isNaN(obj[nameColum]) && obj[nameColum] !== '') {
              obj[nameColum] = +row[numColum];
            }
          });
          arrRows.push(obj);
        }
      });
      arrJson.push({ name: sheetName, data: arrRows });
    });
    return arrJson;
  }
  private transformData(data: {}[]) {
    const products = data.map(product => {
      // crea meta data con valor inicial
      product['meta_data'] = [
        {
          key: '_enable_role_based_price',
          value: '1'
        }
      ];
      // value de rol
      const value = {};
      Object.keys(product).forEach(key => {
        // busca _role_ para ver usuario y su valor
        const pos = key.indexOf('_role_');
        if (pos !== -1) {
          // crea obj
          value[key.replace('_role_', '')] = { regular_price: product[key] };
        }
      });
      // crar arr de los valores
      product['meta_data'].push({
        key: '_role_based_price',
        value: value
      });
      return product;
    });
    return products;
  }
}
