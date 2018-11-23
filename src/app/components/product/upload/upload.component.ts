import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { TokenJwtService } from 'src/app/services/token-jwt.service';
import { ProductService } from 'src/app/services/product.service';
interface Categories {
  name?: string;
  id?: string;
  parentId?: string;
  parentName?: string;
  level?: number;
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit {
  nameFile = '';
  typeFile: string;
  isLogin;
  // isLogin: boolean;
  token;
  isLoad: boolean;
  error: string;
  products: any[];
  acctionsSys = 'Esperando archivo 📁';
  timeUpload = 0;
  constructor(
    private tokenService: TokenJwtService,
    private productService: ProductService,
  ) {}

  ngOnInit() {}
  getToken(user: string, password: string) {
    this.isLogin = false;
    this.tokenService.getTokenJWT(user, password).subscribe(
      data => {
        // console.log(data);
        this.token = data.token;
        this.isLogin = true;
      },
      error => {
        this.error = 'Fallo login';
      },
    );
  }
  postProduct(data: any[]) {
    const timeNow = performance.now();
    this.acctionsSys = 'Subiendo productos transformados, espere... ⬆ ☁️ ';
    this.productService.postProducts(data, this.token).subscribe(res => {
      this.products = res.create;
      console.log(res);
      this.acctionsSys = 'Productos subidos con éxito 👍 !!! ';
      const timeLater = performance.now();
      console.log('Tiempo ms', timeLater - timeNow);
      this.timeUpload = (timeLater - timeNow) / 60000;
      this.isLoad = true;
    });
  }
  link() {
    const input = document.getElementById('file1').click();
  }
  fileChangeEvent(event): void {
    this.isLoad = false;
    // const file = event.target.files[0];
    const name: string = event.target.files.item(0).name;
    const typeFile: string = name.substring(name.indexOf('.') + 1);
    this.typeFile = typeFile;
    this.excelFile(event);
  }
  // Leer Excel
  private excelFile(evt: any): void {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      // pasar de excel a json
      const dataExcelJson = this.exelToJson(wb);
      this.nameFile = dataExcelJson[0].name;
      const products = await this.transformData(dataExcelJson[0].data);
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
        defval: '',
      });
      this.acctionsSys = 'Generando JSON de Excel ...';
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
  private async transformData(data: {}[]) {
    const c = data.map(p => p['categories']);
    const categories = await this.addCategories(c);
    this.acctionsSys = 'Categorias Creadas 😃';
    console.log('categories', categories);
    const products = data.map(product => {
      // crea meta data con valor inicial
      // this.setCategories(product);
      return this.setRolPriceAndCategories(product, categories);
    });
    return products;
  }

  private setRolPriceAndCategories(product: {}, categories: Categories[]) {
    product['meta_data'] = [
      {
        key: '_enable_role_based_price',
        value: '1',
      },
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
      value: value,
    });
    // setea id de categoria
    product['categories'] = this.setCategories(
      product['categories'],
      categories,
    );
    // setea imgs
    product['images'] = product['images'].split(',').map(s => {
      return { src: s };
    });
    return product;
  }
  private setCategories(
    str: string,
    categories: Categories[],
  ): { id: string }[] {
    let ids: { id: string }[] = [];
    if (str.trim() !== '') {
      const numOfParent = str.indexOf('>');
      if (numOfParent !== -1) {
        const arrStr = str.split('>');
        ids = arrStr.map(s => {
          const category = s.trim();
          return { id: categories.find(c => c.name === category).id };
        });
      } else {
        const parent = str.trim();
        ids.push({
          id: categories.find(c => c && c.name === parent).id,
        });
      }
    }
    return ids;
  }
  public async addCategories(categories: string[]): Promise<Categories[]> {
    this.acctionsSys = 'Categorias detectadas...';
    const promise = new Promise<Categories[]>(async (resolve, reject) => {
      const arr: Categories[] = [];
      categories.forEach(str => {
        if (str.trim() !== '') {
          // parents
          const numOfParent = str.indexOf('>');
          if (numOfParent !== -1) {
            const arrCategories = str.split('>');
            arrCategories.forEach((arrStr, i) => {
              const category = arrStr.trim();
              if (i === 0) {
                const isFinded = arr.some(c => c.name === category);
                if (isFinded === false) {
                  arr.push({ name: category, level: i + 1 });
                }
              } else {
                const parent = arrCategories[i - 1].trim();
                const child = category;
                const isParent = arr.some(c => c.name === parent);
                const isChild = arr.some(c => c.name === child);
                if (isParent === false) {
                  arr.push({ name: parent, level: i + 1 });
                }
                if (isChild === false) {
                  console.log('>', arrStr);
                  arr.push({ name: child, parentName: parent, level: i + 1 });
                }
              }
            });
          } else {
            const isFinded = arr.some(c => c.name === str.trim());
            if (isFinded === false) {
              arr.push({ name: str.trim(), level: 1 });
            }
          }
        }
      });
      console.log('arr', arr);
      const loops = Array.from(
        Array(Math.max(...arr.map(c => c.level))).keys(),
      );
      console.log(loops);
      const results = [];
      for (let index = 0; index < loops.length; index++) {
        const level = loops[index] + 1;
        const catOfLevel = arr
          .filter(c => c.level === level)
          .map(cf => {
            if (level === 1) {
              const parent = {};
              parent['name'] = cf.name;
              return parent;
            } else {
              const child = {};
              child['parent'] = results[index - 1].find(
                p => cf.parentName === p.name,
              ).id;
              child['name'] = cf.name;
              return child;
            }
          });
        results[index] = await this.checkCategories(<any>catOfLevel);
        /*   results[index] = await this.productService
          .postCategories(catOfLevel, this.token)
          .toPromise(); */
        this.acctionsSys = `Creando categorias Hijas nivel ${level}...`;
      }
      console.log('results', results);
      resolve([].concat.apply([], results));
    });
    const result = await promise;
    return result;
  }
  async checkCategories(categories: { name: string }[]) {
    const promise = new Promise<Categories[]>(async (resolve, reject) => {
      const finalCategories: Categories[] = [];
      const addCategories: Categories[] = [];
      this.productService
        .getCategories(this.token)
        .subscribe((cat: Categories[]) => {
          categories.forEach(c => {
            const res = cat.find(item => item.name === c.name);
            if (res) {
              finalCategories.push(res);
            } else {
              addCategories.push(c);
            }
          });
          if (addCategories.length > 0) {
            this.acctionsSys = 'Creando categorias';
            this.productService
              .postCategories(addCategories, this.token)
              .subscribe(newCat => {
                resolve([...newCat, ...finalCategories]);
              });
          } else {
            resolve([...finalCategories]);
          }
        });
    });
    const result = await promise;
    return result;
  }
}
