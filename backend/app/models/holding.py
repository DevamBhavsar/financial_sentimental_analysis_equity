from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class Holding(Base):
    __tablename__ = "holdings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    client_id = Column(String, nullable=True)  # Changed to String to match Excel data
    company_name = Column(String, index=True)
    isin = Column(String, index=True)  # Removed unique=True since ISINs can appear multiple times for different clients
    market_cap = Column(Float, nullable=True)  # Made nullable since it might not always be present
    sector = Column(String)
    total_quantity = Column(Integer)
    # free_quantity = Column(Integer)
    # unsettled_quantity = Column(Integer)
    # margin_pledged_quantity = Column(Integer)
    # paylater_mtf_quantity = Column(Integer)
    # unpaid_cusa_qty = Column(Integer)
    # blocked_qty = Column(Integer)
    avg_trading_price = Column(Float)
    ltp = Column(Float)
    invested_value = Column(Float)
    market_value = Column(Float)
    overall_gain_loss = Column(Float)
    # ltcg_quantity = Column(Integer)
    # ltcg_value = Column(Float)
    stcg_quantity = Column(Integer, nullable=True)
    stcg_value = Column(Float, nullable=True)
    
    # Corrected relationship to match UserModel
    user = relationship("User", back_populates="holdings")
    
    def __repr__(self):
        return f"<Holding(company_name='{self.company_name}', isin='{self.isin}', total_quantity={self.total_quantity})>"