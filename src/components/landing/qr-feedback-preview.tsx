import { QrCode, Send, Smartphone } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'
import { motion } from "framer-motion"

export function QrFeedbackPreview() {
    return (
        <section className="relative py-20 md:py-28">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute bottom-0 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute top-1/4 right-1/4 h-[200px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-2xl text-center mb-14"
                >
                    <span className="text-sm font-medium text-primary">Así de fácil</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground md:text-4xl">
                        Del QR al feedback en segundos
                    </h2>
                    <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                        Tu cliente escanea el código, opina y tú recibes el feedback al instante. Sin apps, sin registros, sin fricciones.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* QR Code Card — real QRCodeSVG with indigo on dark bg */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex justify-center lg:justify-end"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative rounded-2xl bg-slate-900 border border-slate-700/60 p-5 w-[280px] shadow-2xl">
                                {/* QR area with corner brackets */}
                                <div className="relative p-4">
                                    {/* Corner brackets — indigo */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-indigo-500 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-indigo-500 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-indigo-500 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-indigo-500 rounded-br-lg" />

                                    {/* Real QR using qrcode.react */}
                                    <div className="px-2 py-2">
                                        <QRCodeSVG
                                            value="https://feedback-flow.com/feedback/demo"
                                            size={200}
                                            level="H"
                                            fgColor="#6366f1"
                                            bgColor="transparent"
                                            imageSettings={{
                                                src: "",
                                                height: 30,
                                                width: 30,
                                                excavate: true,
                                            }}
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                        {/* Center icon overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center border-2 border-indigo-500/60">
                                                <div className="w-4 h-4 rounded-sm border-2 border-indigo-400 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-[2px] bg-indigo-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feedback Form — dark card matching FeedbackPage */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center lg:justify-start"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-purple-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl w-[340px] overflow-hidden">
                                <div className="p-6 sm:p-8 space-y-6">
                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-white text-center">
                                        ¿Cómo fue tu experiencia?
                                    </h3>

                                    {/* Emoji buttons — matching FeedbackPage style */}
                                    <div className="flex justify-center gap-4">
                                        {[
                                            { emoji: "😊", label: "Excelente", selected: true },
                                            { emoji: "😐", label: "Regular", selected: false },
                                            { emoji: "😞", label: "Mala", selected: false },
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform cursor-pointer shadow-md ${item.selected
                                                    ? 'bg-green-900/50 border-2 border-green-500 shadow-green-500/20 scale-110'
                                                    : 'bg-slate-800 border-2 border-transparent'
                                                    }`}>
                                                    {item.emoji}
                                                </div>
                                                <span className={`text-xs font-medium ${item.selected ? 'text-white' : 'text-slate-400'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Comment textarea */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Cuéntanos más sobre tu experiencia
                                        </label>
                                        <div className="rounded-xl bg-slate-800 border border-slate-600 p-3 min-h-[90px]">
                                            <span className="text-sm text-slate-500">Escribe tu comentario aquí...</span>
                                        </div>
                                    </div>

                                    {/* Submit button — gradient matching the app */}
                                    <button className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-purple-700 transition-all">
                                        Enviar comentario
                                        <Send className="w-5 h-5" />
                                    </button>

                                    {/* Powered by */}
                                    <p className="text-center text-xs text-slate-500">
                                        Powered by FeedbackFlow
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground"
                >
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        <span>QR único para tu negocio</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <span>Compatible con cualquier dispositivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-primary" />
                        <span>Sin registro para el cliente</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
