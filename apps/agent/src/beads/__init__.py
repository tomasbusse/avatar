"""
BEADS Configuration Loader

Loads and validates the BEADS (Behavior, Environment, Actions, Data, Signals) 
configuration for the Beethoven AI Agent.
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class PersonaConfig:
    """Agent persona configuration."""
    name: str = "BeethovenTeacher"
    description: str = ""
    voice_id: str = ""
    language: Dict[str, str] = field(default_factory=dict)


@dataclass
class ReasoningConfig:
    """Reasoning LM configuration."""
    model: str = "anthropic/claude-sonnet-4"
    mode: str = "chain_of_thought"
    budget_tokens: int = 2048
    fallback_model: str = "anthropic/claude-3.5-sonnet"


@dataclass
class BehaviorConfig:
    """Behavior section configuration."""
    persona: PersonaConfig = field(default_factory=PersonaConfig)
    reasoning: ReasoningConfig = field(default_factory=ReasoningConfig)
    traits: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderConfig:
    """Provider configuration."""
    provider: str = ""
    model: str = ""
    settings: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EnvironmentConfig:
    """Environment section configuration."""
    runtime: Dict[str, str] = field(default_factory=dict)
    providers: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    secrets: List[str] = field(default_factory=list)


@dataclass
class ActionConfig:
    """Action definition."""
    name: str
    description: str = ""
    rlm_reasoning: bool = False
    sentry_span: bool = True
    uses_vision: bool = False
    database: Optional[str] = None
    parameters: List[Dict[str, Any]] = field(default_factory=list)
    returns: Dict[str, Any] = field(default_factory=dict)


@dataclass
class KnowledgeBaseConfig:
    """Knowledge base configuration."""
    retriever: str = "zep"
    collection: str = ""
    embedding_model: str = "text-embedding-3-small"
    top_k: int = 5
    chunk_size: int = 512
    overlap: int = 50
    rerank: bool = True


@dataclass
class DataConfig:
    """Data section configuration."""
    knowledge_bases: Dict[str, KnowledgeBaseConfig] = field(default_factory=dict)
    state: Dict[str, Any] = field(default_factory=dict)
    cache: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SentryConfig:
    """Sentry configuration."""
    enabled: bool = True
    dsn: str = ""
    environment: str = "development"
    release: str = "local"
    error_tracking: Dict[str, Any] = field(default_factory=dict)
    performance: Dict[str, Any] = field(default_factory=dict)
    integrations: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


@dataclass
class MetricConfig:
    """Metric definition."""
    name: str
    type: str  # histogram, gauge, counter
    description: str = ""
    buckets: List[int] = field(default_factory=list)


@dataclass
class AlertConfig:
    """Alert definition."""
    name: str
    condition: str
    severity: str = "warning"
    channels: List[str] = field(default_factory=list)


@dataclass
class SignalsConfig:
    """Signals section configuration."""
    sentry: SentryConfig = field(default_factory=SentryConfig)
    metrics: Dict[str, List[MetricConfig]] = field(default_factory=dict)
    alerts: List[AlertConfig] = field(default_factory=list)
    logging: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BEADSConfig:
    """Complete BEADS configuration."""
    version: str = "1.0"
    project: str = ""
    behavior: BehaviorConfig = field(default_factory=BehaviorConfig)
    environment: EnvironmentConfig = field(default_factory=EnvironmentConfig)
    actions: List[ActionConfig] = field(default_factory=list)
    data: DataConfig = field(default_factory=DataConfig)
    signals: SignalsConfig = field(default_factory=SignalsConfig)


class BEADSLoader:
    """Loads and manages BEADS configuration."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize loader with optional config path."""
        self.config_path = config_path or self._find_config()
        self._raw_config: Dict[str, Any] = {}
        self._config: Optional[BEADSConfig] = None
        
    def _find_config(self) -> str:
        """Find beads.yaml in project root."""
        # Try multiple possible locations
        possible_paths = [
            Path(__file__).parent.parent.parent.parent.parent / "beads.yaml",  # From src/beads
            Path.cwd() / "beads.yaml",
            Path.cwd().parent / "beads.yaml",
            Path.cwd().parent.parent / "beads.yaml",
        ]
        
        for path in possible_paths:
            if path.exists():
                return str(path)
                
        raise FileNotFoundError("Could not find beads.yaml configuration file")

    
    def load(self) -> BEADSConfig:
        """Load and parse BEADS configuration."""
        if self._config:
            return self._config
            
        logger.info(f"📋 Loading BEADS config from: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            self._raw_config = yaml.safe_load(f)
            
        # Expand environment variables
        self._expand_env_vars(self._raw_config)
        
        # Parse into dataclasses
        self._config = self._parse_config(self._raw_config)
        
        logger.info(f"✅ BEADS config loaded: project={self._config.project}")
        return self._config
        
    def _expand_env_vars(self, config: Dict[str, Any]) -> None:
        """Recursively expand ${VAR} and ${VAR:default} patterns."""
        for key, value in config.items():
            if isinstance(value, str):
                config[key] = self._expand_string(value)
            elif isinstance(value, dict):
                self._expand_env_vars(value)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, str):
                        value[i] = self._expand_string(item)
                    elif isinstance(item, dict):
                        self._expand_env_vars(item)
                        
    def _expand_string(self, value: str) -> str:
        """Expand environment variables in a string."""
        import re
        pattern = r'\$\{([^}:]+)(?::([^}]*))?\}'
        
        def replace(match):
            var_name = match.group(1)
            default = match.group(2) or ""
            return os.environ.get(var_name, default)
            
        return re.sub(pattern, replace, value)
        
    def _parse_config(self, raw: Dict[str, Any]) -> BEADSConfig:
        """Parse raw config into typed dataclasses."""
        config = BEADSConfig(
            version=raw.get("version", "1.0"),
            project=raw.get("project", ""),
        )
        
        # Parse behavior
        if "behavior" in raw:
            b = raw["behavior"]
            config.behavior = BehaviorConfig(
                persona=PersonaConfig(**b.get("persona", {})),
                reasoning=ReasoningConfig(**b.get("reasoning", {})),
                traits=b.get("traits", {}),
            )

            
        # Parse environment
        if "environment" in raw:
            e = raw["environment"]
            config.environment = EnvironmentConfig(
                runtime=e.get("runtime", {}),
                providers=e.get("providers", {}),
                secrets=e.get("secrets", []),
            )
            
        # Parse actions
        if "actions" in raw:
            config.actions = [
                ActionConfig(
                    name=a["name"],
                    description=a.get("description", ""),
                    rlm_reasoning=a.get("rlm_reasoning", False),
                    sentry_span=a.get("sentry_span", True),
                    uses_vision=a.get("uses_vision", False),
                    database=a.get("database"),
                    parameters=a.get("parameters", []),
                    returns=a.get("returns", {}),
                )
                for a in raw["actions"]
            ]
            
        # Parse data
        if "data" in raw:
            d = raw["data"]
            kb_configs = {}
            for name, kb in d.get("knowledge_bases", {}).items():
                kb_configs[name] = KnowledgeBaseConfig(
                    retriever=kb.get("retriever", "zep"),
                    collection=kb.get("collection", name),
                    embedding_model=kb.get("embedding_model", "text-embedding-3-small"),
                    top_k=kb.get("top_k", 5),
                    chunk_size=kb.get("chunk_size", 512),
                    overlap=kb.get("overlap", 50),
                    rerank=kb.get("rerank", True),
                )
            config.data = DataConfig(
                knowledge_bases=kb_configs,
                state=d.get("state", {}),
                cache=d.get("cache", {}),
            )
            
        # Parse signals
        if "signals" in raw:
            s = raw["signals"]
            sentry_raw = s.get("sentry", {})
            config.signals = SignalsConfig(
                sentry=SentryConfig(
                    enabled=sentry_raw.get("enabled", True),
                    dsn=sentry_raw.get("dsn", ""),
                    environment=sentry_raw.get("environment", "development"),
                    release=sentry_raw.get("release", "local"),
                    error_tracking=sentry_raw.get("error_tracking", {}),
                    performance=sentry_raw.get("performance", {}),
                    integrations=sentry_raw.get("integrations", []),
                    tags=sentry_raw.get("tags", []),
                ),
                alerts=[
                    AlertConfig(**a) for a in s.get("alerts", [])
                ],
                logging=s.get("logging", {}),
            )
            
        return config
        
    def get_action(self, name: str) -> Optional[ActionConfig]:
        """Get action config by name."""
        config = self.load()
        for action in config.actions:
            if action.name == name:
                return action
        return None
        
    def get_provider(self, provider_type: str) -> Dict[str, Any]:
        """Get provider config by type (llm, stt, tts, etc.)."""
        config = self.load()
        return config.environment.providers.get(provider_type, {})
        
    @property
    def raw(self) -> Dict[str, Any]:
        """Get raw config dict."""
        if not self._raw_config:
            self.load()
        return self._raw_config


# Global singleton
_beads_loader: Optional[BEADSLoader] = None


def get_beads_config(config_path: Optional[str] = None) -> BEADSConfig:
    """Get the BEADS configuration (singleton)."""
    global _beads_loader
    if _beads_loader is None:
        _beads_loader = BEADSLoader(config_path)
    return _beads_loader.load()


def get_beads_loader() -> BEADSLoader:
    """Get the BEADS loader instance."""
    global _beads_loader
    if _beads_loader is None:
        _beads_loader = BEADSLoader()
    return _beads_loader
