import { TestBed } from '@angular/core/testing';

import { TokenJwtService } from './token-jwt.service';

describe('TokenJwtService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TokenJwtService = TestBed.get(TokenJwtService);
    expect(service).toBeTruthy();
  });
});
