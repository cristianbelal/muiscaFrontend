import { FormControl } from '@angular/forms';
import { FILE_TYPES, MAX_UPLOAD_BYTES, fileExtension, fileSize } from './file-validators';

describe('file validators', () => {
  const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

  it('acepta las extensiones de modelo sin distinguir mayúsculas', () => {
    const validator = fileExtension(FILE_TYPES.model);
    expect(validator(new FormControl(file('SCGo.XMI')))).toBeNull();
    expect(validator(new FormControl(file('modelo.xml')))).toBeNull();
    expect(validator(new FormControl(file('modelo.ecore')))).toEqual({ fileExtension: { allowed: FILE_TYPES.model } });
  });

  it('rechaza archivos vacíos y mayores a 10 MB', () => {
    const validator = fileSize();
    expect(validator(new FormControl(file('a.atl', 0)))).toEqual({ fileEmpty: true });
    expect(validator(new FormControl(file('a.atl', MAX_UPLOAD_BYTES + 1)))).toEqual({
      fileSize: { max: MAX_UPLOAD_BYTES },
    });
    expect(validator(new FormControl(file('a.atl')))).toBeNull();
  });

  it('no valida si no hay archivo (eso lo hace Validators.required)', () => {
    expect(fileExtension(FILE_TYPES.atl)(new FormControl(null))).toBeNull();
  });
});
