# Сборка данных

Сайт читает готовые файлы `data/data.js`, `data/bank.json` и `texts/*.json`.
Они собираются скриптом `assemble.js` из исходников в этой папке.

| Файл | Что это |
| --- | --- |
| `works_extra1.js`, `works_extra2.js` | карточки произведений: герои, пересказ, аргументы (правятся вручную) |
| `kl_parts.js` | клише по частям сочинения и поля автоподстановки (правятся вручную) |
| `src/old.json` | данные первой версии путеводителя (произведения, сочинения, клише по типам тем) |
| `src/sources.json` | аргументы, разобранные из PDF-сборников (`parse.js`) |
| `src/theses.json`, `src/oklist.json` | темы, тезисы и планы из сборника ОК ЕГЭ (`ok.js`) |
| `src/texts-meta.json` | сведения о полных текстах |
| `fetch.py`, `fixfirst.py`, `texts-list.txt` | загрузка текстов классики с ilibrary.ru |

Пересобрать данные (из корня репозитория):

```bash
node build/assemble.js
```

Скачать тексты заново (нужен доступ к ilibrary.ru):

```bash
mkdir -p /tmp/raw && python3 build/fetch.py /tmp/raw < build/texts-list.txt
cp build/texts-list.txt /tmp/list.txt && python3 build/fixfirst.py /tmp/raw
node build/assemble.js /tmp/raw
```
