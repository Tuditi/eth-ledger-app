var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getDataToSign() {
    return __awaiter(this, void 0, void 0, function* () {
        return 'data';
    });
}
function signEthereumTransaction(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('DATA: ', data);
            return 'signature';
        }
        catch (err) {
            console.error(err);
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getDataToSign();
        const signature = yield signEthereumTransaction(data);
        console.log('SIGNATURE: ', signature);
    });
}
void run();
