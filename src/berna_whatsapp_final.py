import re, requests

# Diccionario de acentos - predictivo ya pone acentos
ACENTOS = {'arbol':'árbol','arboles':'árboles','camion':'camión','telefono':'teléfono','musica':'música','codigo':'código','funcion':'función','cancion':'canción','corazon':'corazón','avion':'avión','lapiz':'lápiz','generacion':'generación','informacion':'información','conversacion':'conversación','definicion':'definición','ingles':'inglés','español':'español','mexico':'México','sinaloa':'Sinaloa'}
# Predictivo voz: Comando LS -> comando: ls
NORMALIZA = {'comando ls':'comando: ls','comando el ese':'comando: ls','abre youtube':'bf abre youtube','que hacemos hoy':'que hacemos hoy, berna?'}

def poner_acentos(texto):
    s = ' ' + str(texto or '') + ' '
    for sin, con in ACENTOS.items():
        s = re.sub(r'\b'+sin+r'\b', con, s, flags=re.I)
    return s.strip()

def normalizar_voz(texto):
    t = str(texto or '').lower().strip()
    for k, v in NORMALIZA.items():
        if k in t: t = t.replace(k, v)
    t = poner_acentos(t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def preguntar_cerebro(prompt):
    prompt = normalizar_voz(prompt)
    r = requests.post('https://ia-unificada-bf.vercel.app/api/cerebro', json={'prompt': prompt}, timeout=30)
    return r.json()

if __name__ == '__main__':
    print(normalizar_voz('genera un arbol'))
    print(normalizar_voz('Comando LS'))
    print(preguntar_cerebro('definicion de arbol'))
