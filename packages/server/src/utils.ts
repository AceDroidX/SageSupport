import { CharacterTextSplitter, RecursiveCharacterTextSplitter, type CharacterTextSplitterParams } from "langchain/text_splitter";

export function generateAlphabetUUID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let uuid = '';
    for (let i = 0; i < 32; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        uuid += chars[randomIndex];
    }
    return uuid;
}

/**
 * https://qwen.readthedocs.io/zh-cn/latest/framework/Langchain.html
 * 
 * https://github.com/chatchat-space/Langchain-Chatchat/blob/master/libs/chatchat-server/chatchat/server/file_rag/text_splitter/chinese_text_splitter.py
 */
export class ChineseTextSplitter extends CharacterTextSplitter {
    private pdf: boolean;
    private sentenceSize: number;

    constructor(pdf: boolean = false, sentenceSize: number = 250, rest: Partial<CharacterTextSplitterParams>) {
        super(rest);  // 继承父类的构造函数
        this.pdf = pdf;
        this.sentenceSize = sentenceSize;
    }

    splitText1(text: string): string[] {
        if (this.pdf) {
            text = text.replace(/\n{3,}/g, "\n");
            text = text.replace(/\s/g, " ");
            text = text.replace(/\n\n/g, "");
        }

        const sentSepPattern = /([﹒﹔﹖﹗．。！？]["’”」』]{0,2}|(?=["‘“「『]{1,2}|$))/;
        const sentList: string[] = [];

        const elements = text.split(sentSepPattern);

        elements.forEach(ele => {
            if (sentSepPattern.test(ele) && sentList.length > 0) {
                sentList[sentList.length - 1] += ele;
            } else if (ele) {
                sentList.push(ele);
            }
        });

        return sentList;
    }

    async splitText(text: string): Promise<string[]> {
        if (this.pdf) {
            text = text.replace(/\n{3,}/g, "\n");
            text = text.replace(/\s/g, " ");
            text = text.replace(/\n\n/g, "");
        }

        text = text
            .replace(/([;；.!?。！？\?])([^”’])/g, "$1\n$2")  // 单字符断句符
            .replace(/(\.{6})([^"’”」』])/g, "$1\n$2")        // 英文省略号
            .replace(/(\…{2})([^"’”」』])/g, "$1\n$2")       // 中文省略号
            .replace(/([;；!?。！？\?]["’”」』]{0,2})([^;；!?，。！？\?])/g, "$1\n$2");  // 双引号规则

        text = text.trim();  // 去掉结尾多余的换行符

        let ls = text.split("\n").filter(i => i.length > 0);  // 过滤掉空行

        ls = ls.map(ele => {
            if (ele.length > this.sentenceSize) {
                let ele1 = ele.replace(/([,，.]["’”」』]{0,2})([^,，.])/g, "$1\n$2");
                let ele1List = ele1.split("\n");

                ele1List = ele1List.map(eleEle1 => {
                    if (eleEle1.length > this.sentenceSize) {
                        let ele2 = eleEle1.replace(/([\n]{1,}| {2,}["’”」』]{0,2})([^\s])/g, "$1\n$2");
                        let ele2List = ele2.split("\n");

                        ele2List = ele2List.map(eleEle2 => {
                            if (eleEle2.length > this.sentenceSize) {
                                let ele3 = eleEle2.replace(/( ["’”」』]{0,2})([^ ])/g, "$1\n$2");
                                return ele3.split("\n").filter(i => i.length > 0);
                            }
                            return [eleEle2];
                        }).flat();

                        return ele2List;
                    }
                    return [eleEle1];
                }).flat();

                return ele1List;
            }
            return [ele];
        }).flat();

        return ls;
    }
}


export class ChineseRecursiveTextSplitter extends RecursiveCharacterTextSplitter {
    private _separators: string[];
    private _isSeparatorRegex: boolean;

    constructor(
        separators: string[] = [
            "\n\n",
            "\n",
            "。|！|？",
            "\\.\\s|\\!\\s|\\?\\s",  // 正则表达式需要转义反斜杠
            "；|;\\s",
            "，|,\\s",
        ],
        keepSeparator: boolean = true,
        isSeparatorRegex: boolean = true,
        ...kwargs: any[]
    ) {
        super({ keepSeparator, ...kwargs });  // 传递额外参数给父类
        this._separators = separators;
        this._isSeparatorRegex = isSeparatorRegex;
    }

    private _splitTextWithRegexFromEnd(text: string, separator: string, keepSeparator: boolean): string[] {
        let splits: string[];
        if (separator) {
            if (keepSeparator) {
                const _splits = text.split(new RegExp(`(${separator})`));
                splits = _splits.reduce((acc: string[], curr, idx) => {
                    if (idx % 2 === 0) {
                        acc.push(curr + (_splits[idx + 1] || ''));
                    }
                    return acc;
                }, []);
            } else {
                splits = text.split(new RegExp(separator));
            }
        } else {
            splits = text.split("");  // 按字符拆分
        }

        return splits.filter(s => s !== "");
    }

    async splitText(text: string, separators: string[] = this._separators): Promise<string[]> {
        const finalChunks: string[] = [];
        let separator = separators[separators.length - 1];
        let newSeparators: string[] = [];

        // 选择合适的分隔符
        for (let i = 0; i < separators.length; i++) {
            const _s = separators[i];
            const _separator = this._isSeparatorRegex ? _s : _s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');  // 转义非正则模式的分隔符
            if (_s === "") {
                separator = _s;
                break;
            }
            if (new RegExp(_separator).test(text)) {
                separator = _s;
                newSeparators = separators.slice(i + 1);
                break;
            }
        }

        const _separator = this._isSeparatorRegex ? separator : separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const splits = this._splitTextWithRegexFromEnd(text, _separator, this.keepSeparator);

        // 合并分割的文本，递归处理更长的文本
        const _goodSplits: string[] = [];
        const finalSeparator = this.keepSeparator ? "" : separator;
        splits.forEach(async s => {
            if (await this.lengthFunction(s) < this.chunkSize) {
                _goodSplits.push(s);
            } else {
                if (_goodSplits.length > 0) {
                    const mergedText = await this.mergeSplits(_goodSplits, finalSeparator);
                    finalChunks.push(...mergedText);
                    _goodSplits.length = 0;  // 清空临时存储
                }
                if (newSeparators.length === 0) {
                    finalChunks.push(s);
                } else {
                    const otherInfo = await this.splitText(s, newSeparators);
                    finalChunks.push(...otherInfo);
                }
            }
        });

        if (_goodSplits.length > 0) {
            const mergedText = await this.mergeSplits(_goodSplits, finalSeparator);
            finalChunks.push(...mergedText);
        }

        return finalChunks.map(chunk => chunk.trim()).filter(chunk => chunk !== "");
    }
}