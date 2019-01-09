import { Component, OnInit, Attribute } from '@angular/core';
import * as XLSX from 'xlsx';
import { TokenJwtService } from 'src/app/services/token-jwt.service';
import { ProductService } from 'src/app/services/product.service';
import { SocketIoService } from 'src/app/services/socket-io.service';
import { map } from 'rxjs/operators';
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
  premium = true;
  newProductsUpload = [];
  media = [];
  errorUploads = [];
  constructor(
    private tokenService: TokenJwtService,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    /*  if (this.premium) {
      this.getWebhook();
    } */
  }
  getToken(user: string, password: string) {
    this.isLogin = false;
    this.tokenService.getTokenJWT(user, password).subscribe(
      data => {
        console.log(data);
        this.token = data.token;
        this.isLogin = true;
      },
      error => {
        this.error = 'Fallo login';
      },
    );
  }
  /*   getWebhook() {
    this.socketIOService.onNewProduct().subscribe((newProduct: any) => {
      console.log('newProduct', newProduct);
      this.newProductsUpload = newProduct.data;
    });
  } */
  postProduct(data: any[]) {
    const timeNow = performance.now();
    this.acctionsSys = 'Subiendo productos transformados, espere... ⬆ ☁️ ';
    this.productService.postProducts(data, this.token).subscribe(async res => {
      this.products = res.create;
      console.log(res);
      const variableProds = this.products.filter(p => p.type === 'variable');
      if (variableProds.length > 0) {
        // crear precios con atributos
        const end = await this.setPriceVariable(variableProds, data);
        if (end) {
          this.acctionsSys = 'Productos subidos con éxito 👍 !!! ';
          const timeLater = performance.now();
          console.log('Tiempo ms', timeLater - timeNow);
          this.timeUpload = (timeLater - timeNow) / 60000;
          this.isLoad = true;
        }
      } else {
        this.acctionsSys = 'Productos subidos con éxito 👍 !!! ';
        const timeLater = performance.now();
        console.log('Tiempo ms', timeLater - timeNow);
        this.timeUpload = (timeLater - timeNow) / 60000;
        this.isLoad = true;
      }
      const err = res.create.filter(c => c.error);
      if (err.length > 0) {
        this.acctionsSys = 'Error 🔥 !!! ';

        this.errorUploads = err;
      }
    });
  }
  link() {
    const input = document.getElementById('file1').click();
  }
  async fileChangeEvent(event): Promise<void> {
    this.media = await this.getImgIdbyName();
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
  // llega archivo
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
  // datos para transformar
  private async transformData(data: {}[]) {
    // START categorias
    const c = data.map(p => p['categories']);
    const categories = await this.addCategories(c);
    this.acctionsSys = 'Categorias Creadas 😃';
    console.log('categories', categories);
    // end
    // START Atributos
    const dataAtt = data.filter(d => d['type'] === 'variable');
    let attributes;
    if (dataAtt.length > 0) {
      console.log('dataAtt', dataAtt);
      this.acctionsSys = 'Atributos detectados';
      attributes = await this.addAttributes(<any>dataAtt);
      console.log('attributes', attributes);
      this.acctionsSys = 'Atributos creados 😃';
    }
    // END
    // START Tags
    const tags = data.map(d => <string>d['tags']);
    let listTags;
    if (tags.length > 0) {
      console.log('tag', tags);
      this.acctionsSys = 'Etiquetas detectadas';
      listTags = await this.checkTags(this.converToArray(tags));
      this.acctionsSys = 'Etiquetas creadas 😃';
    }
    // end
    const products = data.map(product => {
      // crea meta data con valor inicial
      // this.setCategories(product);
      return this.setRolPriceAndCategories(
        product,
        categories,
        attributes,
        listTags,
      );
    });
    return products;
  }
  // mapear para que coincida con products model
  private setRolPriceAndCategories(
    product: {},
    categories: Categories[],
    attributes: any[],
    tags: any[],
  ) {
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
    if (product['type'] === 'simple') {
      product['meta_data'].push({
        key: '_role_based_price',
        value: value,
      });
    }
    // setea id de categoria
    if (categories) {
      product['categories'] = this.setCategories(
        product['categories'],
        categories,
      );
    }
    // setea imgs
    product['images'] = product['images'].split(',').map((s: string) => {
      const img = this.media.find(
        m =>
          m.source_url.substring(m.source_url.lastIndexOf('/') + 1) ===
          s.trim(),
      );
      // return { src: s, name: s.substring(s.lastIndexOf('/') + 1) };
      if (img) {
        return { id: img.id };
      }
    });
    // setea atributos y terms
    if (attributes) {
      product['attributes'] = product['attributes']
        .split('|')
        .map((a: string, i: number) => {
          const find = attributes.find(att => att.name === a.trim());
          if (find) {
            return {
              id: find.id,
              visible: true,
              variation: true,
              options: product['terms']
                .split('|')
                [i].split(',')
                .map(item => item.trim()),
            };
          }
        });
    }
    // setea tags
    if (tags) {
      product['tags'] = product['tags'].split(',').map(item => {
        console.log(tags);
        const find = tags.find(t => t.name === item.trim());
        if (find) {
          return {
            id: find.id,
          };
        }
      });
    }

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
  // atributos en productos variables
  async addAttributes(products: { attributes: string; terms: string }[]) {
    let variation = [];
    variation = products.map(product => {
      const newVariation = [];
      product.attributes
        .split('|')
        .map(item => item.trim())
        .forEach((att, i) => {
          const isAtt = variation.some(v => v.name === att);
          if (!isAtt) {
            newVariation.push({
              name: att,
              terms: product.terms
                .split('|')
                [i].split(',')
                .map(item => item.trim()),
            });
          }
        });
      return newVariation;
    });
    const attributes = await this.checkAttribute(variation[0]);

    for (const att of attributes) {
      const find = variation[0].find(p => p.name === att.name);
      const terms = await this.checkTerms(att.id, find.terms);
      console.log('terms', terms);
      this.acctionsSys = 'terms creados';
    }

    return attributes;
  }
  // solo productos variables
  async checkAttribute(attributes: { name: string; terms: string[] }[]) {
    const promise = new Promise<any[]>(async (resolve, reject) => {
      const finalAtt = [];
      const addAtt = [];
      this.productService.getAttributes(this.token).subscribe((atts: any[]) => {
        attributes.forEach(a => {
          const res = atts.find(item => item.name === a.name);
          if (res) {
            finalAtt.push(res);
          } else {
            addAtt.push({ name: a.name });
          }
        });
        if (addAtt.length > 0) {
          this.acctionsSys = 'Creando atributos';
          this.productService
            .postAttributes(addAtt, this.token)
            .subscribe(newCat => {
              console.log('newAtt', newCat);
              resolve([...newCat, ...finalAtt]);
            });
        } else {
          resolve([...finalAtt]);
        }
      });
    });
    const result = await promise;
    return result;
  }
  private async checkTerms(attributeId: string, terms: string[]) {
    console.log('terms', terms);
    console.log('attributeId', attributeId);
    const promise = new Promise<any[]>(async (resolve, reject) => {
      const finalAtt = [];
      const addAtt: { name: string }[] = [];
      this.productService
        .getTerms(attributeId, this.token)
        .subscribe((atts: any[]) => {
          terms.forEach(term => {
            const res = atts.find(item => item.name === term);
            if (res) {
              finalAtt.push(res);
            } else {
              addAtt.push({ name: term });
            }
          });
          if (addAtt.length > 0) {
            this.acctionsSys = 'Creando terms';
            this.productService
              .postTerms(attributeId, addAtt, this.token)
              .subscribe(newCat => {
                resolve([...newCat, ...finalAtt]);
              });
          } else {
            resolve([...finalAtt]);
          }
        });
    });
    const result = await promise;
    return result;
  }
  private async setPriceVariable(
    products: any[],
    data: any[],
  ): Promise<boolean> {
    console.log(products);
    // crear productos a subir
    const prodVar = products.map(product => {
      const prodExcel = data.find(d => d['sku'] === product.sku);
      if (prodExcel) {
        const obj = prodExcel['regular_price'].split(',').map((str: string) => {
          const attributes = str
            .substring(str.indexOf('[') + 1, str.indexOf(']'))
            .split('|')
            .map(item => item.trim())
            .map(option => {
              return {
                id: product.attributes.find(a =>
                  a.options.some(opt => opt === option),
                ).id,
                option: option,
              };
            });
          const price = str.substring(str.indexOf(':') + 1);
          const metadata = this.setMetaData(prodExcel, str);
          const img = this.setImg(
            prodExcel,
            str
              .substring(str.indexOf('[') + 1, str.indexOf(']'))
              .replace(' ', ''),
            product.images,
          );
          console.log('img', img);
          // este es el prod hijo -->
          if (img) {
            return {
              regular_price: +price.trim(),
              attributes: attributes,
              meta_data: metadata,
              image: { id: img },
            };
          } else {
            return {
              regular_price: +price.trim(),
              attributes: attributes,
              meta_data: metadata,
            };
          }
        });
        console.log('obj', obj);
        obj['productId'] = product.id;
        return obj;
      }
    });
    this.acctionsSys = 'Asignando precios a productos variables, espere ...';
    console.log('prodVar', prodVar);
    for (const variations of prodVar) {
      /*  variations = variations.map(v =>
        this.setRolPriceAndCategories(v, undefined, undefined),
      ); */
      const res = await this.productService
        .postProductVariation(variations.productId, variations, this.token)
        .toPromise();
      console.log('res', res);
    }
    return true;
  }
  setMetaData(product: {}, strOptions: string) {
    let meta_data;
    meta_data = [
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
        value[key.replace('_role_', '')] = {
          regular_price: this.getPriceRolVar(product[key], strOptions),
        };
      }
    });
    // crar arr de los valores
    meta_data.push({
      key: '_role_based_price',
      value: value,
    });

    return meta_data;
  }
  private getPriceRolVar(keyValue: string, strOptions: string): number {
    this.acctionsSys = `Asignando precios 💰`;
    const strOptionsProd = strOptions
      .substring(strOptions.indexOf('[') + 1, strOptions.indexOf(']'))
      .replace(' ', '');
    const price = keyValue.split(',').find((str: string) => {
      const valuesRol = str
        .substring(str.indexOf('[') + 1, str.indexOf(']'))
        .replace(' ', '');

      if (valuesRol === strOptionsProd) {
        return true;
      }
    });
    if (price) {
      console.log(price);
      return +price.substring(price.indexOf(':') + 1);
    }
  }
  private setImg(product: {}, productStr: string, arrImgs: any[]) {
    this.acctionsSys = 'Subiendo Imagenes 🖼';
    // value de rol
    let value;
    Object.keys(product).forEach(key => {
      // busca images_variable para ver usuario y su valor
      const pos = key.indexOf('images_variable');
      if (pos !== -1) {
        // crea obj
        const arrStr = product[key].split(';');
        const img: string = arrStr.find(
          str =>
            str
              .substring(str.indexOf('[') + 1, str.indexOf(']'))
              .replace(' ', '') === productStr,
        );
        if (img) {
          value = img.substring(img.indexOf(':') + 1);
          const imgUp = this.media.find(
            m =>
              m.source_url.substring(m.source_url.lastIndexOf('/') + 1) ===
              value.trim(),
          );
          if (imgUp) {
            value = imgUp.id;
          }
        }
      }
    });
    return value;
  }
  private async getImgIdbyName() {
    return await this.productService.getMedias(this.token).toPromise();
  }
  // tags
  private converToArray(strArr: string[]): string[] {
    let res: string[] = [];
    for (const str of strArr) {
      const arr = str.split(',').map(s => s);
      if (arr.length) {
        res = [...res, ...str.split(',').map(s => s.trim())];
      } else {
        res.push(str.trim());
      }
    }

    return res;
  }
  private async checkTags(tags: string[]) {
    console.log('tags input', tags);
    const promise = new Promise<any[]>(async (resolve, reject) => {
      const finalAtt = [];
      const addAtt = [];
      this.productService.getTags(this.token).subscribe((tagsApi: any[]) => {
        tags.forEach(tag => {
          const res = tagsApi.find(t => t.name === tag);
          if (res) {
            finalAtt.push(res);
          } else {
            addAtt.push({ name: tag });
          }
        });
        if (addAtt.length > 0) {
          this.acctionsSys = 'Creando Etiquetas ⛏';
          this.productService
            .postProductTags(addAtt, this.token)
            .subscribe(newCat => {
              resolve([...newCat, ...finalAtt]);
            });
        } else {
          resolve([...finalAtt]);
        }
      });
    });
    const result = await promise;
    console.log('tags on che', result);
    return result;
  }
}
