import { ImageSourcePropType } from 'react-native';

export interface Bank {
    code: string;
    name: string;
    shortName: string;
    logo: ImageSourcePropType;
}

export const BANKS: Bank[] = [
    { code: 'TCB', name: 'Techcombank', shortName: 'Techcombank', logo: require('@/assets/logos/TCB.png') },
    { code: 'VCB', name: 'Vietcombank', shortName: 'Vietcombank', logo: require('@/assets/logos/VCB.png') },
    { code: 'BIDV', name: 'BIDV', shortName: 'BIDV', logo: require('@/assets/logos/BIDV.png') },
    { code: 'CTG', name: 'VietinBank', shortName: 'Vietinbank', logo: require('@/assets/logos/CTG.png') },
    { code: 'MB', name: 'MB Bank', shortName: 'MBBank', logo: require('@/assets/logos/MB.png') },
    { code: 'ACB', name: 'ACB', shortName: 'ACB', logo: require('@/assets/logos/ACB.png') },
    { code: 'TPB', name: 'TPBank', shortName: 'TPBank', logo: require('@/assets/logos/TPB.png') },
    { code: 'VPB', name: 'VPBank', shortName: 'VPBank', logo: require('@/assets/logos/VPB.png') },
    { code: 'STB', name: 'Sacombank', shortName: 'Sacombank', logo: require('@/assets/logos/STB.png') },
    { code: 'HDB', name: 'HDBank', shortName: 'HDBank', logo: require('@/assets/logos/HDB.png') },
    { code: 'VIB', name: 'VIB', shortName: 'VIB', logo: require('@/assets/logos/VIB.png') },
    { code: 'SHB', name: 'SHB', shortName: 'SHB', logo: require('@/assets/logos/SHB.png') },
    { code: 'EIB', name: 'Eximbank', shortName: 'Eximbank', logo: require('@/assets/logos/EIB.png') },
    { code: 'MSB', name: 'MSB', shortName: 'MSB', logo: require('@/assets/logos/MSB.png') },
    { code: 'OCB', name: 'OCB', shortName: 'OCB', logo: require('@/assets/logos/OCB.png') },
    { code: 'LPB', name: 'LienVietPostBank', shortName: 'LienVietPostBank', logo: require('@/assets/logos/LPB.png') },
    { code: 'SCB', name: 'SCB', shortName: 'SCB', logo: require('@/assets/logos/SCB.png') },
    { code: 'ABB', name: 'ABBank', shortName: 'ABBank', logo: require('@/assets/logos/ABB.png') },
    { code: 'BAB', name: 'Bac A Bank', shortName: 'BacABank', logo: require('@/assets/logos/BAB.png') },
    { code: 'NAB', name: 'Nam A Bank', shortName: 'NamABank', logo: require('@/assets/logos/NAB.png') },
];

export const DEFAULT_BANK_CODE = 'TCB';

export function getBankByCode(code: string): Bank | undefined {
    return BANKS.find(bank => bank.code === code);
}
