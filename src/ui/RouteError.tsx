import { useRouteError } from "react-router-dom";

export const RouteError = () => {
  const error = useRouteError();
  console.error("Falha ao exibir a página", error);

  return (
    <main translate="no" style={{ padding: 32, color: "var(--sand-ink)" }}>
      <h1>Não foi possível exibir esta página</h1>
      <p>
        Recarregue a página para tentar novamente. Se a tradução automática do
        navegador estiver ativa, desative-a: a interface já está em português.
      </p>
      <p>Seus baralhos salvos continuam neste navegador.</p>
      <button onClick={() => window.location.reload()}>
        Recarregar página
      </button>
      <p>
        <a href="/">Voltar ao início</a>
      </p>
    </main>
  );
};
