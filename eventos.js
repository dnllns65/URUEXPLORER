// UruExplorer - Local Events Database
const EVENTOS = [
    {
        id: 1,
        destino: "Cabo Polonio",
        departamento: "Rocha",
        titulo: "Feria de Artesanías de Cabo Polonio",
        tipo: "Feria",
        fecha: "Diario durante temporada (Ene-Feb)",
        descripcion: "Feria con piezas únicas hechas por artesanos locales en lanas rústicas, maderas náuticas y caracolas.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 2,
        destino: "Cabo Polonio",
        departamento: "Rocha",
        titulo: "Fogonada Acústica en la Playa",
        tipo: "Fiesta",
        fecha: "Todos los sábados de Enero y Febrero",
        descripcion: "Encuentro musical a la luz de la luna en la Playa Sur. Músicos locales e invitados con guitarras y percusión.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 3,
        destino: "Punta del Este",
        departamento: "Maldonado",
        titulo: "Festival Internacional de Cine de Punta del Este",
        tipo: "Cine",
        fecha: "15 al 22 de Julio, 2026",
        descripcion: "Muestra internacional con proyecciones y debates en las salas de cine locales más importantes y el Teatro de Verano.",
        ticketUrl: "https://www.eventbrite.com/e/festival-cine-punta-del-este",
        gratis: false
    },
    {
        id: 4,
        destino: "Punta del Este",
        departamento: "Maldonado",
        titulo: "Sunset Party José Ignacio",
        tipo: "Fiesta",
        fecha: "28 de Enero, 2027",
        descripcion: "Música electrónica con DJ internacionales al atardecer frente al faro de José Ignacio. Un clásico del verano.",
        ticketUrl: "https://www.passline.com/sunset-jose-ignacio",
        gratis: false
    },
    {
        id: 5,
        destino: "Montevideo",
        departamento: "Montevideo",
        titulo: "Concierto de Gala de la Filarmónica",
        tipo: "Concierto",
        fecha: "15 de Agosto, 2026",
        descripcion: "La Orquesta Filarmónica de Montevideo presenta un programa especial en el imponente Teatro Solís.",
        ticketUrl: "https://tickantel.com.uy/concierto-filarmonica-solis",
        gratis: false
    },
    {
        id: 6,
        destino: "Montevideo",
        departamento: "Montevideo",
        titulo: "La Omisión de la Familia Coleto (Teatro)",
        tipo: "Teatro",
        fecha: "Viernes y Sábados de Julio",
        descripcion: "Aclamada obra teatral uruguaya en el Teatro El Galpón. Comedia dramática con elenco estelar.",
        ticketUrl: "https://tickantel.com.uy/la-omision-coleto",
        gratis: false
    },
    {
        id: 7,
        destino: "Montevideo",
        departamento: "Montevideo",
        titulo: "Feria de Tristán Narvaja",
        tipo: "Feria",
        fecha: "Todos los domingos (9:00 a 16:00)",
        descripcion: "La feria más tradicional de Montevideo en el barrio Cordón. Libros, antigüedades, mascotas, discos y rarezas.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 8,
        destino: "Montevideo",
        departamento: "Montevideo",
        titulo: "Desfile y Llamadas de Candombe en Barrio Sur",
        tipo: "Cultural",
        fecha: "Todos los domingos de tarde",
        descripcion: "Salidas espontáneas y ensayos de comparsas tradicionales de candombe recorriendo las calles Isla de Flores y Ansina.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 9,
        destino: "Tacuarembó",
        departamento: "Tacuarembó",
        titulo: "Fiesta de la Patria Gaucha",
        tipo: "Fiesta",
        fecha: "3 al 8 de Marzo, 2027",
        descripcion: "La celebración criolla más grande de América del Sur en la Laguna de las Lavanderas. Jineteadas, payadas, fogones y música folk en vivo.",
        ticketUrl: "https://reduts.com.uy/patria-gaucha-tacuarembo",
        gratis: false
    },
    {
        id: 10,
        destino: "San Gregorio de Polanco",
        departamento: "Tacuarembó",
        titulo: "Taller Abierto de Pintura y Muralismo",
        tipo: "Cultural",
        fecha: "Fines de semana de Enero",
        descripcion: "Pintores uruguayos restauran y crean nuevos murales en el museo abierto de la ciudad. Abierto a la observación del público.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 11,
        destino: "Colonia del Sacramento",
        departamento: "Colonia",
        titulo: "Paseo Nocturno de la Linterna",
        tipo: "Cultural",
        fecha: "Jueves y sábados de noche",
        descripcion: "Recorrido histórico dramatizado por callejuelas de piedra del casco histórico guiado por personajes de época con linternas de aceite.",
        ticketUrl: "https://www.passline.com/colonia-paseo-nocturno",
        gratis: false
    },
    {
        id: 12,
        destino: "Villa Serrana",
        departamento: "Lavalleja",
        titulo: "Semana de Lavalleja y Noche de los Fogones",
        tipo: "Fiesta",
        fecha: "Octubre de cada año",
        descripcion: "Gran festival musical al pie del Cerro Artigas en Minas, con la Noche de los Fogones reuniendo a miles bajo las estrellas.",
        ticketUrl: "",
        gratis: true
    },
    {
        id: 13,
        destino: "Termas del Daymán",
        departamento: "Salto",
        titulo: "Festival Termal y Cerveza Artesanal",
        tipo: "Feria",
        fecha: "Semana de Turismo (Semana Santa)",
        descripcion: "Feria de productores locales de cerveza artesanal, con patios de comidas y música acústica a metros de las piscinas termales.",
        ticketUrl: "https://www.eventbrite.com/e/festival-termal-salto",
        gratis: false
    },
    {
        id: 14,
        destino: "Piriápolis",
        departamento: "Maldonado",
        titulo: "Piriápolis de Película",
        tipo: "Cine",
        fecha: "Octubre",
        descripcion: "Festival de cine independiente iberoamericano en el histórico Argentino Hotel, con proyecciones abiertas al público.",
        ticketUrl: "",
        gratis: true
    }
];
