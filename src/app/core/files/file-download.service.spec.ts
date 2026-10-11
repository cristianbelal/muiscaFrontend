import { filenameFrom } from './file-download.service';

describe('filenameFrom', () => {
  it('prefiere filename* codificado en UTF-8 (ContentDisposition de Spring)', () => {
    expect(filenameFrom(`attachment; filename="=?UTF-8?Q?x?="; filename*=UTF-8''contrato%20%C3%B1.zip`)).toBe(
      'contrato ñ.zip',
    );
  });

  it('usa filename simple cuando no hay versión codificada', () => {
    expect(filenameFrom('attachment; filename="hyperledgerGo.ecore"')).toBe('hyperledgerGo.ecore');
  });

  it('devuelve null sin cabecera', () => {
    expect(filenameFrom(null)).toBeNull();
  });
});
