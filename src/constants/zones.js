const ZONE_NAMES = [
  /* row 0 */ "LE1","LE2","AE1","AE2","PE1","PE2",
  /* row 1 */ "MDE1","MDE2","MCE1","MCE2","MOE1","MOE2",
  /* row 2 */ "CD1","CD2","CC1","CC2","CO1","CO2",
  /* row 3 */ "MDD1","MDD2","MCD1","MCD2","MOD1","MOD2",
  /* row 4 */ "LD1","LD2","AD1","AD2","PD1","PD2",
];

/* Portrait zones (5 rows × 6 cols = 30) */
const FX1=0.029, FX2=0.970, FY1=0.044, FY2=0.956;
const SX=(FX2-FX1)/6, SY=(FY2-FY1)/5;

export const ZONES_P=[];
for(let r=0;r<5;r++) for(let c=0;c<6;c++){
  ZONES_P.push({
    id:r*6+c, row:r, col:c,
    name:ZONE_NAMES[r*6+c],
    x1:FX1+c*SX, x2:FX1+(c+1)*SX,
    y1:FY1+r*SY, y2:FY1+(r+1)*SY,
  });
}

/* Landscape zones (same IDs, transposed geometry) */
const LX1=0.044, LX2=0.956, LY1=0.030, LY2=0.971;
const LSX=(LX2-LX1)/6, LSY=(LY2-LY1)/5;

export const ZONES_L=[];
for(let r=0;r<5;r++) for(let c=0;c<6;c++){
  ZONES_L.push({
    id:r*6+c, row:r, col:c,
    name:ZONE_NAMES[r*6+c],
    x1:LX1+c*LSX, x2:LX1+(c+1)*LSX,
    y1:LY1+r*LSY, y2:LY1+(r+1)*LSY,
  });
}
